/**
 * Video
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */


 // sloppy notes:
 // grabbing duration using tcprobe:
 // tcprobe -i /media/sf_TV/American.Dad.S08E01.HDTV.x264-LOL.mp4 | grep -Eo 'duration=[0-9:.]*' > foo.txt
 // => "duration=0:21:38.088"
 // avprobe /media/sf_TV/American.Dad.S09E09.HDTV.x264-LOL.mp4 2>&1 | grep -Eo 'Duration: [0-9:.]*' | cut -c 11-
 // => "00:20:59.71"
 // grabbing screenshots using libav-tools avconv:
 // ss can be duration format or number of seconds
 // avconv -ss 8000 -i /media/sf_TV/American.Dad.S08E01.HDTV.x264-LOL.mp4 -qscale 1 -vsync 1 -r 25 ~/foo.jpg

var _ = require('lodash'),
    bash = require('bash'),
		asnyc = require('async'),
		path = require('path'),
		uuid = require('node-uuid'),
    Q = require('q'),
		exec = require('child_process').exec,
    parseXML = require('xml2js').parseString,
		request = require('request');

var THUMB_DIR = process.cwd() + '/files/thumbs/';

var grab_duration_string = function(raw_file_path, cb) {
	var command = "avprobe " + bash.escape(raw_file_path) + " 2>&1 | grep -Eo 'Duration: [0-9:.]*' | cut -c 11-";
	console.log("Running", command);
	exec(command, function (err, stdout, stderr) {
		if (err) { cb("Error grabbing duration", null); }
		else {
			cb(null, stdout);
		}
	});
};

var titleize = function(str) {
	if (str == null) return '';
	return String(str).replace(/(?:^|\s)\S/g, function(c){ return c.toUpperCase(); });
};

var TVDB_KEY = "C0BAA9786923CE73";

var splitOnPipe = function(str) {
	return _.uniq(_.compact(str.split("|")));
};

module.exports = {

  attributes: {
  	title: 'string',
  	type: 'string',
  	episode: 'integer',
  	season: 'integer',
  	duration: 'json',
  	raw_file_path: {
  		type: 'string',
  		required: true,
  		unique: true
  	},
  	left_off_at: 'integer',
    series_id: 'integer',
  	series_metadata: 'json',
  	episode_metadata: 'json',
  	thumbnails: 'json',
  	valid_extensions: ['mp4', 'mkv', 'webm']
  },

  beforeCreate: function(values, next) {
  	guessedValues = Video.guessit(values.raw_file_path);
  	_.merge(values, guessedValues);
  	Video.updateDuration(values, function(valuesWithDuration) {
	  	next();
  	});
  },

  afterCreate: function(video, cb) {
    var at = 2*60;
    var name = uuid.v4() + ".jpg";
    var output = path.join(THUMB_DIR, name);
    thumb = Video.createThumbnail(video, output, at);
    thumb.done(function() {
      Video.update({
        id: video.id
      }, {
        thumbnails: [name]
      }, function(err, videos) {
        var result = videos[0];
        if (err) {
          cb("Unable to update thumbnails");
        } else {
          cb(null, result);
        }
      });
    });
  },

  guessit: function (raw_file_path) {
    // see https://github.com/midgetspy/Sick-Beard/blob/development/sickbeard/name_parser/regexes.py
    var scene = /([\w\._\s]*)S(\d+)[\s-_\.]?E(\d+)/i; // e.,g "Adventure.Time.S05E44.HDTV.x264-QCF.mp4"
    var re = /([\w\._\s]*)(?:.*)(\d+)x(?:.*)(\d+)/i; // e.,g "Adventure Time - 5x09 - All Your Fault.mkv"

    var fileName = raw_file_path.split("/").splice(-1)[0];
    var parsed = {};

    var matches = scene.exec(fileName);
    if (!matches || matches.length !== 4) {
      matches = re.exec(fileName);
    }

    if (matches) {
      if (matches[1]) {
        parsed['title'] = titleize(matches[1].replace(/[-_\.]/g, ' ').trim());
      } else {
        parsed['title'] = "Unknown";
      }
      if (matches[2]) {
        parsed['season'] = parseInt(matches[2], 10);
      }
      if (matches[3]) {
        parsed['episode'] = parseInt(matches[3], 10);
      }
    }

    return parsed;
  },

  updateDuration: function (values, cb) {
  	grab_duration_string(values.raw_file_path, function(err, duration) {
  		var split;
  		if (duration) { split = duration.split(":"); }
  		if (split && split.length === 3) {
  			values.duration = {
  				hours: Number(split[0]),
  				minutes: Number(split[1]),
  				seconds: Number(split[2])
  			}
  		}
  		cb(values);
  	});
  },

  getThumbnails: function(video, nThumbnails, cb) {

  	if (video.thumbnails && video.thumbnails.length > 1) {
  		cb(null, video);
  		return;
  	}

  	var duration = Video.durationInSeconds(video);
    var tasks = [];
  	var filenames = [];
  	for (var i = 1; i < nThumbnails; i++) {
  		var name = uuid.v4() + ".jpg";
  		var output = path.join(THUMB_DIR, name);
  		var at = parseInt(duration * (i / nThumbnails));
  		tasks.push(Video.createThumbnail(video, output, at));
  		filenames.push(name);
  	}

    Q.allSettled(tasks).then(function () {
      console.log("Thumbnail creation finished for video", video.raw_file_path);
      Video.update({
        id: video.id
      }, {
        thumbnails: filenames
      }, function(err, videos) {
        var result = videos[0];
        if (err) {
          cb("Unable to update thumbnails");
        } else {
          cb(null, result);
        }
      });
    });
  },

  createThumbnail: function(video, outputFilename, nSeconds, cb) {
    var dfrd = Q.defer();
    var path = bash.escape(video.raw_file_path);
  	var command = "avconv -ss "+ nSeconds +" -i "+ path +" -qscale 1 -vsync 1 -vframes 1 -y " + outputFilename;
		console.log("Running command", command);
		exec(command, function (err, stdout, stderr) {
      console.log(err, stdout, stderr);
      dfrd.resolve();
    });
    return dfrd.promise;
  },

  durationInSeconds: function(video) {
  	if (video.duration) {
  		return video.duration.hours*60*60 + video.duration.minutes*60 + video.duration.seconds;
  	} else {
  		return 0;
  	}
  },

  findOrCreate: function (raw_file_path, callback) {
		Video.findOne({
    	raw_file_path: raw_file_path
    }).done(function(err, result) {
      if (err) { callback(err); }

      if (!result) {
        Video.create({
          raw_file_path: raw_file_path
        }).done(function(err, video) {
          if (err) { callback(err); }
          callback(null, video);
        });
      } else {
        callback(null, result);
      }
    });
  },

  leftPad: function (number, targetLength) {
    var output = parseInt(number, 10) + '';
    while (output.length < targetLength) {
        output = '0' + output;
    }
    return output;
  },

  // updates metadata on all Videos that share the same title
  updateMetadata: function (video_title, callback) {
  	console.log("Requesting: ", "http://thetvdb.com/api/GetSeries.php?seriesname=" + video_title)
		request("http://thetvdb.com/api/GetSeries.php?seriesname=" + video_title, function (err, response, body) {
			if (err) { callback("Unable to contact thetvdb", null); return; }

			parseXML(body, {trim: true}, function(err, result) {
			  if (err) { callback("Unable to parse XML result: " + err, null); return; }

	  		if (result.Data && result.Data.Series) {
	  			console.log("Requesting: ", "http://thetvdb.com/api/"+ TVDB_KEY +"/series/"+ result.Data.Series[0].seriesid[0] +"/all/")
					request("http://thetvdb.com/api/"+ TVDB_KEY +"/series/"+ result.Data.Series[0].seriesid[0] +"/all/", function (err, response, body) {
						if (err) { callback("Unable to fetch detailed series data"); return; }
						parseXML(body, {trim: true, explicitArray: false}, function(err, episode_metadata) {
							if (err) { callback("Unable to parse XML result: " + err, null); return; }

							var series = episode_metadata.Data.Series;
							// split actors into array:
							if (series.Actors) {
								series.Actors = splitOnPipe(series.Actors);
							}
							if (series.Genre) {
								series.Genre = splitOnPipe(series.Genre);
							}

							Series.findOrCreate(video_title, {
								title: video_title,
								series_metadata: series
							}, function(err, resulting_series) {
								if (err) throw err;

                Video.update({title: video_title}, {
                  series_metadata: series,
                  series_id: resulting_series.id
                }, function (err, updated) {
                  if (err) { callback("Unable to persist series metadata"); return; }

                  // update each individual episode now
                  async.map(episode_metadata.Data.Episode, function (episode, cb) {
                    Video.update({
                      title: video_title,
                      season: episode.SeasonNumber,
                      episode: episode.EpisodeNumber
                    }, {
                      episode_metadata: episode
                    }, function (err, updated) {
                      if (err) { callback("Unable to persist episode metadata"); return; }
                      cb(null, updated);
                    });
                  }, function (err, results) {
                    if (err) { callback("Unable to persist all episode metadata"); return; }
                    callback(null, results);
                  });

                });
							});
						});
					});
	  		} else {
	  			callback("No results", null); return;
	  		}
			});
		});
  }
};
