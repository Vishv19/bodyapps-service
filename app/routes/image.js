/*
 * Copyright (c) 2014, Fashiontec (http://fashiontec.org)
 * Licensed under LGPL, Version 3
 */

/*
 * Router for 'Image' resource. 
 * 
 * It creates a new record of 'Images' for Measurements.
 */

var Image = require('../models/image');
var validator = require('validator');

function returnImageRec(doc)
{
  var imageRecord = {
    data :{
      side: doc.side,
      m_id: doc.m_id,
      type: doc.type,
      binary_data: doc.binary_data
    }
  };
  return imageRecord;
}

module.exports = function(app) {
  app.post('/users/measurements/image', function (req, res, next) {
    var body = req.body;
    var side = body.side;
    var m_id = body.m_id;
    var binary_data = body.binary_data;

    if(validator.isNull(m_id) || validator.isNull(side) 
      || validator.isNull(binary_data))  return res.json(400, {image:null});

    Image.create( body, function (err, doc) {
      if (err) return next(err);
      var imageRecord = returnImageRec(doc);
      return res.json(201,imageRecord);
      })
  });

  app.get('/users/:user_id/measurements/:measurement_id/image/:side', 
    function(req, res) {
      var body = req.body;
      var id = req.params.measurement_id;
      var side = req.params.side;

      Image.findOne({m_id: id ,side:side}, function(err, doc) {
        if(err)  return next(err);
        if(doc) {
          var imageRecord = returnImageRec(doc);
          return res.json(200,imageRecord);
        }
        return res.json(404,{image:null});
      })
  });
}
