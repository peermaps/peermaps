var pumpify = require('pumpify')
var gunzip = require('zlib').createGunzip
var o5mdecode = require('o5m-decode')
var through = require('through2')

module.exports = function (opts) {
  if (!opts) opts = {}
  var format = opts.format || 'json'
  return function (wsen) {
    if (format === 'object') {
      return pumpify(gunzip(), o5mdecode(), filter())
    } else if (format === 'json') {
      return pumpify(gunzip(), o5mdecode(), filter(), json())
    } else if (format === 'ndj' || format === 'ndjson') {
      return pumpify(gunzip(), o5mdecode(), filter(), ndjson())
    }
    function filter () {
      return through.obj() // TODO
    }
  }
}
function json () {
  var first = true
  return through.obj(write, end)
  function write (row, enc, next) {
    var str = (first ? '[' : ',\n') + JSON.stringify(row)
    first = false
    next(null, str)
  }
  function end (next) {
    this.push(']\n')
    next()
  }
}

function ndjson () {
  return through.obj(function (row, enc, next) {
    next(null, JSON.stringify(row) + '\n')
  })
}
