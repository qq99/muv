module.exports =

  destroy: (req, res) ->
    return res.json
      Sorry: 'not implemented'

  view: (req, res) ->
    Series.findOne({title: req.params.id}).done (err, series) ->
      return res.send(err, 500) if err

      Video.find({title: req.params.id})
        .sort('episode ASC')
        .sort('season ASC')
        .done (err, videos) ->
          return res.send(err, 500) if err

          res.view
            series: series
            videos: videos

  list: (req, res) ->
    Series.find().sort('title ASC').done (err, series) ->
      return res.send(err,500) if err

      return res.view
        title: "muv - series"
        series: series

  favourite: (req, res) ->
    favourite = req.method == 'POST' # DELETE => false

    Series.update({title: req.params.id}, {
      isFavourite: favourite
    }).done (err, series) ->
      return res.json(series)

  _config: {}
