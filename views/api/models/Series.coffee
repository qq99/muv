module.exports =

  attributes:
    title:
      type: 'string'
      required: true
      unique: true
    series_metadata: 'json'
    isFavourite: 'boolean'
    last_watched_id: 'integer'

  findOrCreate: (title, attributes, callback) ->
    Series.findOne({
      title: title
    }).exec (err, result) ->
      if err
        callback(err)
        return

      if result
        callback(null, result)
      else
        Series.create(attributes).exec (err, series) ->
          if err
            callback(err)
          else
            callback(null, series)
