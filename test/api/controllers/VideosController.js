/**
 * VideosController
 *
 * @module      :: Controller
 * @description	:: A set of functions called `actions`.
 *
 *                 Actions contain code telling Sails how to respond to a certain type of request.
 *                 (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 *                 You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 *                 and/or override them with custom routes (`config/routes.js`)
 *
 *                 NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

var fs = require("fs"),
    _ = require("lodash"),
    recursive = require("recursive-readdir"),
    process = require("child_process"),
    async = require("async"),
    path = require("path");

var isNumber = function (n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};

module.exports = {


  /**
   * Action blueprints:
   *    `/videos/list`
   */
  list: function (req, res) {

    Video.find().sort('title ASC').done(function(err, videos) {
      if (err) return res.send(err,500);

      return res.view({
        title: "muv - all videos",
        videos: videos
      });
    });
  },

  getMetadata: function (req, res) {

    // e.g., http://thetvdb.com/api/GetSeries.php?seriesname=True%20Detective
    Video.findOne({id: req.params.id}).done(function (err, video) {
      if (err) return res.send(err, 500);

      Video.updateMetadata(video.title, function (err, updatedRecords) {
        if (err) return res.send(err, 500);
        res.json(updatedRecords);
      });
    });
  },

  getThumbnails: function (req, res) {
    Video.findOne({id: req.params.id}).done(function (err, video) {
      if (err) return res.send(err, 500);

      Video.getThumbnails(video, 10, function (err, video) {
        if (err) return res.send(err, 500);
        res.json(video.thumbnails);
      });
    });
  },

  setLeftOffAt: function (req, res) {
    Video.update({id: req.params.id}, {
      left_off_at: req.body.left_off_at
    }).done(function (err, videos) {
      if (err) return res.send(err, 500);
      res.json({status: 'ok', debug: videos[0]});
    });
  },

  stream: function (req, res) {

    Video.findOne(req.params.id).done(function (err, video) {
      if (err) return res.send(err, 500);
      var range = typeof req.headers.range === "string" ? req.headers.range : undefined;
      var stat = fs.statSync(video.raw_file_path);
      if (!stat.isFile()) {
        res.send("Not a file", 500);
      }
      var info = {};
      info.path = video.raw_file_path;
      info.start = 0;
      info.end = stat.size - 1;
      info.size = stat.size;
      info.modified = stat.mtime;
      info.rangeRequest = false;

      // see https://github.com/meloncholy/vid-streamer/blob/master/index.js

      if (range !== undefined && (range = range.match(/bytes=(.+)-(.+)?/)) !== null) {
        // Check range contains numbers and they fit in the file.
        // Make sure info.start & info.end are numbers (not strings) or stream.pipe errors out if start > 0.
        info.start = isNumber(range[1]) && range[1] >= 0 && range[1] < info.end ? range[1] - 0 : info.start;
        info.end = isNumber(range[2]) && range[2] > info.start && range[2] <= info.end ? range[2] - 0 : info.end;
        info.rangeRequest = true;
      }
      // } else if (reqUrl.query.start || reqUrl.query.end) {
      //   // This is a range request, but doesn't get range headers. So there.
      //   info.start = isNumber(reqUrl.query.start) && reqUrl.query.start >= 0 && reqUrl.query.start < info.end ? reqUrl.query.start - 0 : info.start;
      //   info.end = isNumber(reqUrl.query.end) && reqUrl.query.end > info.start && reqUrl.query.end <= info.end ? reqUrl.query.end - 0 : info.end;
      // }

      info.length = info.end - info.start + 1;

      var header = {
        "Cache-Control": "public; max-age=0",
        Connection: "keep-alive",
        // "Content-Type": info.mime,
        "Content-Disposition": "inline; filename=" + info.file + ";"
      };
      var code = 200;
      if (info.rangeRequest) {
        // Partial http response
        code = 206;
        header.Status = "206 Partial Content";
        header["Accept-Ranges"] = "bytes";
        header["Content-Range"] = "bytes " + info.start + "-" + info.end + "/" + info.size;
      }
      header.Pragma = "public";
      header["Last-Modified"] = info.modified.toUTCString();
      header["Content-Transfer-Encoding"] = "binary";
      header["Content-Length"] = info.length;

      res.writeHead(code, header);

      var stream = fs.createReadStream(info.path, { flags: "r", start: info.start, end: info.end });
      stream.pipe(res);
      return true;
    });
  },

  watch: function (req, res) {
    Video.findOne(req.param('id')).done(function (err, video) {
      if (err) return res.send(err, 500);

      return res.view({
        video: video
      });
    });
  },

  generate: function (req, res) {

    // Video.create({
    //   raw_file_path: "/TV/Bobs.Burgers.S03E22.HDTV.x264-LOL.mp4"
    // }).done(function(err, video) {
    //   res.json(video);
    // });


    var p = path.resolve('/TV');
    var titles = [];
    recursive(p, function (err, files) {

      files = _.remove(files, function(elem) {
        var ext = elem.substr(elem.lastIndexOf('.') + 1);
        var indexInArray = _.indexOf(Video.attributes.valid_extensions, ext);
        return indexInArray !== -1;
      });

      var testFiles = files;//.slice(0,20);

      async.mapLimit(testFiles, 500, function (fileName, cb) {
        Video.findOrCreate(fileName, function(err, result) {
          if (err) res.send(err, 500);
          titles.push(result.title);
          cb(null, result);
        });
      }, function (err, results) {
        if (err) res.send(err, 500);

        async.mapLimit(_.uniq(_.compact(titles)), 5, function (video_title, cb) {
          Video.updateMetadata(video_title, function(err, results) {
            if (err) res.send(err, 500);
            cb(null, results);
          });
        }, function (err, results) {
          if (err) res.send(err, 500);

          res.json(results);
        });
      });

    });
  },




  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to VideosController)
   */
  _config: {}


};
