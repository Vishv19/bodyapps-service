/*
 * Copyright (c) 2014, Fashiontec (http://fashiontec.org)
 * Licensed under LGPL, Version 3
*/

/*
 * Router for 'Measurement' resource. 
 * 
 * It handles the request of (1)Finding a measurement record of user.
 * (2)Providing a list of measurement records.(3)Creating a measurement
 * record.
 */

var Measurement = require('../models/measurement');
var User = require('../models/user');
var Image = require('../models/image');
var validator = require('validator');
var xml = require('./xmlBuilder');
var archiver = require('archiver');
var async = require('async');

function addXmlToZip(measurement, user, fileNameList, zip, next) {
  var xmlDoc = xml.returnXML(measurement, user, fileNameList);

  zip.append(new Buffer(xmlDoc),
    { name:'hdf.xml' });

  zip.finalize(function (err) {
    if (err) next(err);
  });
}

function errorResponse(message, status) {
  var message = {
    error: {
      message: message,
      status: status
    }
  };
  return message;
}

function returnMeasurementRec(req, doc, user_id) {
  var measurementRecord = {
    data :{
      m_id : doc.m_id,
      m_unit: doc.m_unit,
      m_timestamp : doc.m_timestamp,
      mid_neck_girth : doc.mid_neck_girth,
      bust_girth :doc.bust_girth,
      waist_girth : doc.waist_girth, 
      hip_girth : doc.hip_girth,
      across_back_shoulder_width : doc.across_back_shoulder_width,
      shoulder_drop : doc. shoulder_drop,
      shoulder_slope_degrees : doc.shoulder_slope_degrees,
      arm_length : doc.arm_length,
      wrist_girth : doc.wrist_girth,
      upper_arm_girth : doc.upper_arm_girth,
      armscye_girth : doc.armscye_girth,
      height : doc.height,
      hip_height :doc.hip_height,
      person:{
        name: doc.person.name, 
        email:doc.person.email,
        gender: doc.person.gender,
        dob: doc.person.dob
      },user_id : doc.user_id
    }
  };
  if(doc.images.length!= 0) {
    measurementRecord.data.images = {};
    for(var i = 0; i < doc.images.length; i++) {
      var imageNumber = 'image'+ (i+1);
      var path = '/users/'+ user_id + '/measurements/'+ doc.m_id + '/image/'
        + doc.images[0].idref;
      var href = req.protocol + '://' + req.headers.host + path;
      measurementRecord.data.images[imageNumber] = { rel : doc.images[0].rel, 
        idref : href};
    }
  }
  return measurementRecord;
}

module.exports = function(app) {
  app.get('/users/:user_id/measurements', function(req, res, next) { 
    var user_id = req.params.user_id;

    Measurement.find({ user_id: user_id}, function(err, docs) {
      if(err)  return next(err);
      var measurementList = [];
      if(docs.length==0)  {
        return res.json({ data: measurementList});
      }
      docs.forEach(function(doc) {
        var measurementRecord = returnMeasurementRec(req, doc, user_id);
        measurementList.push(measurementRecord);
      });
      return res.json(measurementList);
    })
  });

  app.get('/users/:user_id/measurements/:measurement_id', function(req, res, next) {
    var m_id = req.params.measurement_id;
    var user_id = req.params.user_id;

    if(req.get('Accept') == 'application/json') {
      Measurement.findOne({ m_id: m_id}, function(err, doc) {
        if(err)  return next(err);
        if(doc) {
          var measurementRecord = returnMeasurementRec(req, doc, user_id);
          return res.json(measurementRecord);
        }
        return res.json(404,
          errorResponse('Measurement record not found', 404));
      })
    }
    else if (req.get('Accept') == 'application/vnd.valentina.hdf') {
      var zip = archiver('zip');
      res.set('Content-type', 'application/vnd.valentina.hdf');

      zip.on('error', function(err) {
        if(err) next(err);
      });

      zip.on('end', function() {
        res.end();
      });

      zip.pipe(res);
      var fileNameList = [];

      User.findOne({ _id: user_id}, function(err, user) {
        if(err)  return next(err);
        if(validator.isNull(user))  return res.send(404,'user not found');
        Measurement.findOne({ m_id: m_id}, function(err, measurement) {
          if(err)  return next(err);
          if(validator.isNull(measurement))  
            return res.send(404,'measurement not found');
          if(measurement.images.length!=0) {
            async.each(measurement.images, function(image, callback) {
              Image.findOne({ _id: image.idref}, function(err, doc) {
                if(err)  return next(err);
                // var fileName = 'pictures/'+ image.idref + '.' + image.type;
                var fileName = 'pictures/'+ image.idref + '.' + 'txt';
                zip.append(doc.binary_data, {name: fileName});
                fileNameList.push(fileName);
                callback();
              });
            },
              function(err) {
                if(err)  next(err);
                addXmlToZip(measurement, user, fileNameList, zip, next);
              }
            )
          }
          else {
            addXmlToZip(measurement, user, fileNameList, zip, next);
          }
        });
      });
    }
    else {
      return res.send(406, 'Not Acceptable Request');
    }
  });

  app.post('/users/:user_id/measurements', function(req, res) {
    var body = req.body;
    var personName = body.person.name;
    var personDob = body.person.dob;
    var personGender = body.person.gender;
    var user_id = req.params.user_id;

    if(validator.isNull(personName) || validator.isNull(personDob) 
      || validator.isNull(personGender)) {
        return res.json(400,
          errorResponse('Email not found', 400));
    }
    Measurement.create(body, function(err, doc) {
      if(err)  return next(err);
      var measurementRecord = returnMeasurementRec(req, doc, user_id);
      return res.json(201,measurementRecord);
    })

  });
}
