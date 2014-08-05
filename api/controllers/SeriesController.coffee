URI = require('URIjs')

module.exports =

  destroy: (req, res) ->
    return res.json
      Sorry: 'not implemented'

  view: (req, res) ->
    Series.findOne({title: req.params.id}).done (err, series) ->
      return res.send(err, 500) if err

      options =
        title: req.params.id

      whenFound = (err, videos) ->
        return res.send(err, 500) if err

        season = parseInt(req.query?.season, 10) || undefined
        season_numbers = _.uniq(_.map videos, (video) -> video.season)
        filtered_videos = videos

        if req.query?.season
          filtered_videos = _.where videos, (video) ->
            video.season == season

        render = (opts = {}) ->
          render_options =
            URI: URI
            last_watched_video: null
            season: season
            series: series
            videos: filtered_videos
            season_numbers: season_numbers
            filter_options: options
            sort: req.query?.sort || 'latest'

          res.view _.merge(render_options, opts)

        if series.last_watched_id
          Video.findOne({id: series.last_watched_id}).done (err, last_watched_video) ->
            render({last_watched_video: last_watched_video})
        else
          render()

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
