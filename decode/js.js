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
      var inside = {}, outside = {}
      return through.obj(write)
      function write (row, enc, next) {
        if (row.type === 'node') {
          var lon = row.longitude, lat = row.latitude
          var isin = lon >= wsen[0] && lon <= wsen[2]
            && lat >= wsen[1] && lat <= wsen[3]
          if (isin) {
            inside[row.id] = true
            next(null, row)
          } else {
            outside[row.id] = row
            next(null)
          }
        } else if (row.type === 'way') {
          for (var i = 0; i < row.refs.length; i++) {
            if (inside[row.refs[i]]) {
              inside[row.id] = true
              for (var j = 0; j < row.refs.length; j++) {
                var r = row.refs[j]
                if (outside[r]) {
                  inside[r] = true
                  this.push(outside[r])
                  outside[r] = null
                }
              }
              return next(null, row)
            }
          }
          next()
        } else if (row.type === 'relation') {
          for (var i = 0; i < row.members.length; i++) {
            if (inside[row.members[i].id]) {
              inside[row.id] = true
              return next(null, row)
            }
          }
          next()
        } else next()
      }
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
