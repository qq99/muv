/**
 * Video
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

var _ = require("lodash");

var titleize = function(str) {
	if (str == null) return '';
	return String(str).replace(/(?:^|\s)\S/g, function(c){ return c.toUpperCase(); });
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
  adapter: ['redis'],

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
  	valid_extensions: ['mp4', 'avi', 'mkv']
  },

  beforeCreate: function(values, next) {
  	guessedValues = guessit(values.raw_file_path);
  	values = _.merge(values, guessedValues);
  	next();
  }
};
