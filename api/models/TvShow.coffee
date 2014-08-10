_ = require('lodash')
Video = require("./Video.js")

TvShow = _.merge(_.cloneDeep(Video), {
  identity: 'video'
  globalId: 'TvShow'
})

module.exports = TvShow
