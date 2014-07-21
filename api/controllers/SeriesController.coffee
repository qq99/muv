module.exports =

  destroy: (req, res) ->
    return res.json
      Sorry: 'not implemented'

  view: (req, res) ->
    Series.findOne({title: req.params.id}).done (err, series) ->
      return res.send(err, 500) if err

      options =
        title: req.params.id

      if req.query?.season
        options['season'] = parseInt(req.query.season, 10) || 1


      whenFound = (err, videos) ->
        return res.send(err, 500) if err

        season_numbers = _.uniq(_.map videos, (video) -> video.season)

        res.view
          series: series
          videos: videos
          season_numbers: season_numbers
          filter_options: options
          sort: req.query?.sort || 'latest'


      if req.query?.sort == 'latest'
        Video.find(options)
          .sort('season DESC')
          .sort('episode DESC')
          .done whenFound
      else if req.query?.sort == 'order'
        Video.find(options)
          .sort('season ASC')
          .sort('episode ASC')
          .done whenFound
      else
        Video.find(options)
          .sort('season DESC')
          .sort('episode DESC')
          .done whenFound

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
