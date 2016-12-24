var through = require('through2')
var pumpify = require('pumpify')
var split = require('split2')

module.exports = function (wsen) {
  var stream = through(write,end)
  stream.push("<?xml version='1.0' encoding='UTF-8'?>\n"
    + '<osm version="0.6" generator="peermaps 1.0.0">\n'
    + '<bounds minlat="' + wsen[0] + '" minlon="' + wsen[1]
      + '" maxlat="' + wsen[2] + '" maxlon="' + wsen[3] + '"/>\n')
  return pumpify(split(), stream)
  function write (buf, enc, next) {
    var str = buf.toString('utf8')
    if (/^\s*<\/?osm\b/.test(str)) return next()
    else if (/^\s*<bounds\b/.test(str)) return next()
    else next(null, str + '\n')
  }
  function end (next) {
    this.push('</osm>\n')
    next()
  }
}
