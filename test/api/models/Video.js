/**
 * Video
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

var _ = require('lodash'),
		asnyc = require('async'),
    parseXML = require('xml2js').parseString,
		request = require('request');

var titleize = function(str) {
	if (str == null) return '';
	return String(str).replace(/(?:^|\s)\S/g, function(c){ return c.toUpperCase(); });
};

var TVDB_KEY = "C0BAA9786923CE73";

var splitOnPipe = function(str) {
	return _.uniq(_.compact(str.split("|")));
};

var guessit = function (raw_file_path, cb) {

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
	    parsed['season'] = matches[2];
	  }
	  if (matches[3]) {
	    parsed['episode'] = matches[3];
	  }
	}
	
	return parsed;
};

module.exports = {

  attributes: {
  	title: 'string',
  	type: 'string',
  	episode: 'integer',
  	season: 'integer',
  	raw_file_path: {
  		type: 'string',
  		required: true,
  		unique: true
  	},
  	series_metadata: 'json',
  	episode_metadata: 'json',
  	valid_extensions: ['mp4', 'avi', 'mkv']
  },

  beforeCreate: function(values, next) {
  	guessedValues = guessit(values.raw_file_path);
  	values = _.merge(values, guessedValues);
  	next();
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
						parseXML(body, {trim: true, explicitArray: false}, function(err, result) {
							if (err) { callback("Unable to parse XML result: " + err, null); return; }

							var series = result.Data.Series;
							// split actors into array:
							if (series.Actors) {
								series.Actors = splitOnPipe(series.Actors);
							}
							if (series.Genre) {
								series.Genre = splitOnPipe(series.Genre);
							}

							series_meta = {
								series_metadata: series
							};
							Series.findOrCreate(video_title, {
								title: video_title,
								series_metadata: series
							}, function(err, result) {
								if (err) throw err;
							});

							Video.update({title: video_title}, series_meta, function (err, updated) {
								if (err) { callback("Unable to persist series metadata"); return; }

								// update each individual episode now
								async.map(result.Data.Episode, function (episode, cb) {
									var episode_meta = {
										episode_metadata: episode
									};

									Video.update({title: video_title, season: episode.SeasonNumber, episode: episode.EpisodeNumber}, episode_meta, function (err, updated) {
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
	  		} else {
	  			callback("No results", null); return;
	  		}
			});
		});
  }
};
