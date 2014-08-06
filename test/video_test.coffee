chai = require('chai')
sinon = require('sinon')

expect = chai.expect
assert = chai.assert
spy = sinon.spy
mock = sinon.mock
stub = sinon.stub

Sails = require('sails')

describe 'Video (model)', ->
  before (done) ->
    Sails.lift
      log:
        level: 'error'
    , (err, sails) ->
      app = sails
      done(err, sails)

  describe 'guessit', ->
    it 'works with format Adventure.Time.S05E44.HDTV.x264-QCF.mp4', ->
      guessed = Video.guessit("Adventure.Time.S05E44.HDTV.x264-QCF.mp4")
      assert.equal 'Adventure Time', guessed['title']
      assert.equal 5, guessed['season']
      assert.equal 44, guessed['episode']

    it 'works with format Adventure Time - 5x09 - All Your Fault.mkv', ->
      guessed = Video.guessit("Adventure Time - 5x09 - All Your Fault.mkv")
      assert.equal 'Adventure Time', guessed['title']
      assert.equal 5, guessed['season']
      assert.equal 9, guessed['episode']
