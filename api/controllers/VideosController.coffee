fs = require("fs")
_ = require("lodash")
recursive = require("recursive-readdir")
async = require("async")
path = require("path")

isNumber = (n) ->
  return !isNaN(parseFloat(n)) && isFinite(n)

module.exports =

  thumb: (req, res) ->
    filename = req.params.id # UNSAFE; sanitize this
    location = path.join(process.cwd(), '/files/thumbs/', filename)

    if fs.existsSync(location)
      img = fs.readFileSync(location)
    else
      location = path.join(process.cwd(), '/files/thumbs/no-image.png')
      img = fs.readFileSync(location)

    res.writeHead 200, {'Content-Type': 'image/jpg'}
    res.end img, 'binary'

  list: (req, res) ->

    Video.find().sort('title ASC').done (err, videos) ->
      return res.send(err, 500) if (err)

      return res.view({
        title: "muv - all videos"
        videos: videos
      })

  getMetadata: (req, res) ->

    Video.findOne({id: req.params.id}).done (err, video) ->
      return res.send(err, 500) if (err)

      Video.updateMetadata video.title, (err, updatedRecords) ->
        return res.send(err, 500) if (err)
        res.json(updatedRecords)

  getThumbnails: (req, res) ->

    Video.findOne({id: req.params.id}).done (err, video) ->
      return res.send(err, 500) if (err)

      Video.getThumbnails video, 10, (err, video) ->
        return res.send(err, 500) if (err)
        res.json(video.thumbnails)

  setLeftOffAt: (req, res) ->

    Video.update {id: req.params.id},
      {left_off_at: req.body.left_off_at}
    .done (err, videos) ->
      return res.send(err, 500) if err
      res.json
        status: 'ok'

  stream: (req, res) ->

    Video.findOne(req.params.id).done (err, video) ->
      return res.send(err, 500) if err
      range = req.headers.range
      stat = fs.statSync(video.raw_file_path)
      return res.send("Not a file", 500) if !stat.isFile()

      info =
        path: video.raw_file_path
        start: 0
        end: stat.size - 1
        size: stat.size
        modified: stat.mtime
        rangeRequest: false

      # see https://github.com/meloncholy/vid-streamer/blob/master/index.js

      if range && (range = range.match(/bytes=(.+)-(.+)?/)) != null
        # Check range contains numbers and they fit in the file.
        # Make sure info.start & info.end are numbers (not strings) or stream.pipe errors out if start > 0.
        r1 = parseFloat(range[1])
        r2 = parseFloat(range[2])
        if r1 >= 0 && r1 < info.end
          info.start = r1
        if r2 > info.start && r2 <= info.end
          info.end = r2
        info.rangeRequest = true

      info.length = info.end - info.start + 1

      header =
        "Cache-Control": "public; max-age=0"
        "Connection": "keep-alive"
        #"Content-Type": info.mime
        "Content-Disposition": "inline; filename=#{info.file};"
        "Pragma": "public"
        "Last-Modified": info.modified.toUTCString()
        "Content-Transfer-Encoding": "binary"
        "Content-Length": info.length

      code = 200

      if info.rangeRequest # Partial http response
        code = 206
        header["Status"] = "206 Partial Content"
        header["Accept-Ranges"] = "bytes"
        header["Content-Range"] = "bytes #{info.start}-#{info.end}/#{info.size}"

      res.writeHead(code, header)

      stream = fs.createReadStream info.path,
        flags: "r"
        start: info.start
        end: info.end

      stream.pipe(res)
      return true

  watch: (req, res) ->
    Video.findOne(req.param('id')).done (err, video) ->
      return res.send(err, 500) if err

      Series.update {id: video.series_id},
        {last_watched_id: video.id}, (err, series) ->
          sails.log.error(err) if err

      return res.view
        video: video

  generate: (req, res) ->


    source = path.resolve('/media/sf_TV') # TODO: use multiple folders, user supplied and configurable, etc
    titles = []

    recursive source, (err, files) ->

      files = _.remove files, (elem) ->
        ext = elem.substr(elem.lastIndexOf('.') + 1)
        indexInArray = _.indexOf(Video.attributes.valid_extensions, ext)
        return indexInArray != -1

      testFiles = files #.slice(0,20) # a smaller subset for testing

      async.map testFiles, (fileName, cb) ->
        Video.findOrCreate fileName, (err, result) ->
          res.send(err, 500) if err
          titles.push(result.title)
          cb(null, result)
      , (err, results) ->
        res.send(err, 500) if err

        async.mapLimit _.uniq(_.compact(titles)), 5, (video_title, cb) ->
          Video.updateMetadata video_title, (err, results) ->
            res.send(err, 500) if err
            cb(null, results)
        , (err, results) ->
          res.send(err, 500) if err

          res.json({
            everything: 'is ok!'
          });

  _config: {}

