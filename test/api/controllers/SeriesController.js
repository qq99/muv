/**
 * SeriesController
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

module.exports = {
    
  /**
   * Action blueprints:
   *    `/series/destroy`
   */
  destroy: function (req, res) {
    
    // Send a JSON response
    return res.json({
      hello: 'world'
    });
  },

  view: function (req, res) {
    // e.g., `/series/The Simpsons`
    Series.findOne({title: req.params.id}).done(function(err, series) {
      if (err) return res.send(err, 500);

      Video.find({title: req.params.id}).sort('episode ASC').sort('season ASC').done(function (err, videos) {
        if (err) return res.send(err, 500);

        res.view({
          series: series,
          videos: videos
        });
      });
    });
  },


  /**
   * Action blueprints:
   *    `/series/list`
   */
  list: function (req, res) {
    
    Series.find().sort('title ASC').done(function(err, series) {
      if (err) return res.send(err,500);

      return res.view({
        title: "muv - series",
        series: series
      });
    });
  },

  favourite: function (req, res) {
    if (req.method === 'DELETE') {
      Series.update({title: req.params.id}, {
        isFavourite: false
      }).done(function (err, series) {
        return res.json(series);
      });
    } else if (req.method === 'POST') {
      Series.update({title: req.params.id}, {
        isFavourite: true
      }).done(function (err, series) {
        return res.json(series);
      });
    }

  },


  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to SeriesController)
   */
  _config: {}

  
};
