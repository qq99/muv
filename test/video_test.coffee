chai = require('chai')
sinon = require('sinon')

expect = chai.expect
assert = chai.assert
spy = sinon.spy
mock = sinon.mock
stub = sinon.stub

Sails = require('sails')
path = require('path')
fs = require("fs")

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

    it 'works with format The Simpsons S24E01 HDTV h264-rr.mp4', ->
      guessed = Video.guessit("The Simpsons S24E01 HDTV h264-rr.mp4")
      assert.equal 'The Simpsons', guessed['title']
      assert.equal 24, guessed['season']
      assert.equal 1, guessed['episode']

    it 'works with format Archer (2009) - 1x08 - The Rock.mp4', ->
      guessed = Video.guessit("Archer (2009) - 1x08 - The Rock.mp4")
      assert.equal 'Archer (2009)', guessed['title']
      assert.equal 1, guessed['season']
      assert.equal 8, guessed['episode']

    # https://github.com/midgetspy/Sick-Beard/blob/development/sickbeard/name_parser/regexes.py
    describe 'SickBeard format: standard', ->

      it 'Show.Name.S01E02.Source.Quality.Etc-Group', ->
        guessed = Video.guessit("Show.Name.S01E02.Source.Quality.Etc-Group.mp4")
        assert.equal 'Show Name', guessed['title']
        assert.equal 1, guessed['season']
        assert.equal 2, guessed['episode']

      it 'Show Name - S01E02 - My Ep Name', ->
        guessed = Video.guessit("Show Name - S01E02 - My Ep Name.mp4")
        assert.equal 'Show Name', guessed['title']
        assert.equal 1, guessed['season']
        assert.equal 2, guessed['episode']

      it 'Show.Name.S01.E03.My.Ep.Name', ->
        guessed = Video.guessit("Show.Name.S01.E03.My.Ep.Name.mp4")
        assert.equal 'Show Name', guessed['title']
        assert.equal 1, guessed['season']
        assert.equal 3, guessed['episode']

      it 'Show.Name.S01.E03.My.Ep.Name', ->
        guessed = Video.guessit("Show.Name.S01E02E03.Source.Quality.Etc-Group.mp4")
        assert.equal 'Show Name', guessed['title']
        assert.equal 1, guessed['season']
        assert.equal 2, guessed['episode']

      it 'Show Name - S01E02-03 - My Ep Name', ->
        guessed = Video.guessit("Show.Name.S01E02E03.Source.Quality.Etc-Group.mp4")
        assert.equal 'Show Name', guessed['title']
        assert.equal 1, guessed['season']
        assert.equal 2, guessed['episode']

      it 'Show.Name.S01.E02.E03', ->
        guessed = Video.guessit("Show.Name.S01.E02.E03.mp4")
        assert.equal 'Show Name', guessed['title']
        assert.equal 1, guessed['season']
        assert.equal 2, guessed['episode']

    describe 'SickBeard format: fov', ->
      it 'Show_Name.1x02.Source_Quality_Etc-Group', ->
        guessed = Video.guessit("Show_Name.1x02.Source_Quality_Etc-Group.mp4")
        assert.equal 'Show Name', guessed['title']
        assert.equal 1, guessed['season']
        assert.equal 2, guessed['episode']

      it 'Show Name - 1x02 - My Ep Name', ->
        guessed = Video.guessit("Show Name - 1x02 - My Ep Name.mp4")
        assert.equal 'Show Name', guessed['title']
        assert.equal 1, guessed['season']
        assert.equal 2, guessed['episode']

      it 'Show_Name.1x02x03x04.Source_Quality_Etc-Group', ->
        guessed = Video.guessit("Show_Name.1x02x03x04.Source_Quality_Etc-Group.mp4")
        assert.equal 'Show Name', guessed['title']
        assert.equal 1, guessed['season']
        assert.equal 2, guessed['episode']

      it 'Show Name - 1x02-03-04 - My Ep Name', ->
        guessed = Video.guessit("Show Name - 1x02-03-04 - My Ep Name.mp4")
        assert.equal 'Show Name', guessed['title']
        assert.equal 1, guessed['season']
        assert.equal 2, guessed['episode']

  describe 'updateDuration', ->
    it 'gets the duration correctly from a file', (done) ->
      video =
        raw_file_path: path.join(process.cwd(), "./test/files/BigBuckBunny_320x180.mp4")
        foo: 'bar'
      Video.updateDuration video, (result) ->
        assert.equal 'bar', result.foo # merges duration into existing object
        assert.equal 0, result.duration.hours
        assert.equal 9, result.duration.minutes
        assert.equal 56.45, result.duration.seconds
        done()

  describe 'thumbnails', ->
    before ->
      @outputFolder = path.join(process.cwd(), "./test/files/")
      @outputJpg = path.join(@outputFolder, "thumb.jpg")
      @bigBuckBunny =
        raw_file_path: path.join(process.cwd(), "./test/files/BigBuckBunny_320x180.mp4")
        duration:
          hours: 0
          minutes: 9
          seconds: 56.45

      @cleanScratchFolder = ->
        for file in fs.readdirSync(@outputFolder)
          if file.indexOf(".jpg") >= 0
            fs.unlinkSync path.join(@outputFolder, file)

    afterEach ->
      @cleanScratchFolder()

    it 'has a property that represents where it will store files created', ->
      assert.equal path.join(process.cwd(), '/files/thumbs/'), Video.THUMB_DIR

    it 'createThumbnail can create a thumbnail of a video at a specified time', (done) ->
      deferred = Video.createThumbnail @bigBuckBunny, @outputJpg, 10

      deferred.done =>
        if fs.existsSync(@outputJpg)
          fs.unlinkSync(@outputJpg)
          done()
        else
          throw "createThumbnail did not output a thumb.jpg"

    it 'createThumbnail will reject its promise if it fails', (done) ->
      nonexistentFile = path.join(process.cwd(), "does.not.exist.mp4")
      deferred = Video.createThumbnail {raw_file_path: nonexistentFile}, @outputJpg, 10

      deferred.fail ->
        done()

    it 'getThumbnails will create N thumbnails for a video', (done) ->

      oldFolder = Video.THUMB_DIR
      Video.THUMB_DIR = @outputFolder

      deferred = Video.getThumbnails @bigBuckBunny, 5, (err, result) =>
        Video.THUMB_DIR = oldFolder
        if err
          throw "Error"
        else
          jpgs = for file in fs.readdirSync(@outputFolder)
            file.indexOf(".jpg") >= 0
          assert.equal 5, jpgs.length
          done()

  describe 'durationInSeconds', ->
    it 'will convert a duration obj into seconds', ->
      video =
        duration:
          hours: 0
          minutes: 1
          seconds: 0

      seconds = Video.durationInSeconds(video)

      assert.equal 60, seconds

    it 'works', ->
      video =
        duration:
          hours: 1
          minutes: 2
          seconds: 3

      seconds = Video.durationInSeconds(video)

      assert.equal 3723, seconds
