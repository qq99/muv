var Sails = require('sails');
var chai = require('chai');
var sinon = require('sinon');
path = require('path');
fs = require("fs");

expect = chai.expect;
assert = chai.assert;
spy = sinon.spy;
mock = sinon.mock;
stub = sinon.stub;

before(function(done) {
  Sails.lift({
    // configuration for testing purposes
  }, function(err, sails) {
    if (err) return done(err);
    // here you can load fixtures, etc.
    done(err, sails);
  });
});

after(function(done) {
  // here you can clear fixtures, etc.
  sails.lower(done);
});
