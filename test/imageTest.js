/*
 * Copyright (c) 2014, Fashiontec (http://fashiontec.org)
 * Licensed under LGPL, Version 3
 */

/*
 * API tests of the bodyapps user backend service.
 */

var request = require('supertest');
var assert = require('assert');
var _ = require('lodash');

var app = require('../app.js');
var User = require('../app/models/user');
var Measurement = require('../app/models/measurement');
var Image = require('../app/models/image');
var measurement;
var user;
var image;
var data;

beforeEach(function(done) {
  User.create({
    name: 'Wile E. Coyote',
    dob: '09/17/1949',
    age: '100',
    email: 'willy.e.coyote@acme.org'
  }, function(err, _user) {
      user = _user;
      done(err);
  })
});

beforeEach(function(done) {
  Measurement.create({
    m_unit: 'cm',
    mid_neck_girth : '10',
    bust_girth :'10',
    waist_girth : '10', 
    hip_girth : '10',
    across_back_shoulder_width : '10', 
    shoulder_drop : '10',
    shoulder_slope_degrees :'10', 
    arm_length :'10',
    wrist_girth : '10',
    upper_arm_girth : '10', 
    armscye_girth : '10',
    height : '10',
    hip_height :'10',
    person : {
    name: 'john', 
    email:'john@hotmail.com',
    gender: 'male',
    dob: '12/10/1990'
    },
    user_id : user.id
  }, function(err,_measurement) {
        measurement = _measurement;
        done(err);
    })
});

beforeEach(function(done) {
  Image.create(
    data = {
      side: 'front' ,
      m_id: measurement.m_id ,
      type: 'jpg',
      binary_data: 'binary_data'
      }, function(err, _image) {
          image = _image;
          done(err);
      })
});

// Reset database
afterEach(function(done) {
  User.collection.remove(done);
});

afterEach(function(done) {
  Measurement.collection.remove(done);
});

afterEach(function(done) {
  Image.collection.remove(done);
});

describe('Image API', function() {
  var api = request(app);

  describe('GET /users/:user_id/measurements/:measurement_id/image', 
    function() {

      it('should return a single image record', function(done) {
        var url = '/users/' + user.id + '/measurements/' + measurement.m_id
        + '/image/'+ image.side;
        console.log('GET ' + url);
        api.get(url)
          .expect(200)
          .expect('Content-type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            assert.ok(res.body.data);
            assert.equal(image.side, res.body.data.side);
            assert.equal(image.m_id, res.body.data.m_id);
            assert.equal(image.type, res.body.data.type);
            assert.equal(image.binary_data, res.body.data.binary_data);
            done();
          });
      });

      it('should respond 404 if a image was not found', function(done) {
        api.get('/users/abc123/measurements/xyz123/image/face')
          .expect('Content-type', /json/)
          .expect(404, done);
      });

  });

  describe('POST /users/measurements/image', function() {

  it('should create a new image in measurement record', function(done) {
    api.post('/users/measurements/image')
      .send(data)
      .expect('Content-type', /json/)
      .expect(201)
      .end(function(err, res) {
        assert.ok(res.body.data);
        assert.ok(res.body.data.side);
        assert.ok(res.body.data.m_id);
        assert.ok(res.body.data.type);
        assert.ok(res.body.data.binary_data);
        done();
        });
    });

    it('should reject a image w/o side and m_id and data', function(done) {
      var _data = _.clone(data);
      delete(_data.side);
      delete(_data.m_id);
      delete(_data.binary_data);

      api.post('/users/measurements/image')
        .send(_data)
        .expect('Content-type', /json/)
        .expect(400, done);
    })
  });

})
