/**
 * Series
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

  attributes: {
  	title: {
  		type: 'string',
  		required: true,
  		unique: true
  	},
  	series_metadata: 'json'
  },

  findOrCreate: function (title, attributes, callback) {
	Series.findOne({
    	title: title
    }).done(function(err, result) {
      if (err) { callback(err); }

      if (!result) {
        Series.create(attributes).done(function(err, series) {
          if (err) { callback(err); }
          callback(null, series);
        });
      } else {
        callback(null, result);
      }
    });
  },

};
