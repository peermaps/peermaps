var spawn = require('child_process').spawn
var duplexify = require('duplexify')
var through = require('through2')
var split = require('split2')

module.exports = function () {
  return function (wsen) {
    var bounds = '<bounds minlat="' + wsen[0] + '" minlon="' + wsen[1]
      + '" maxlat="' + wsen[2] + '" maxlon="' + wsen[3] + '"/>'
    var ps = spawn('osmconvert',['-','-b='+wsen.join(',')])
    var d = duplexify()
    var first = true
    d.setReadable(ps.stdout.pipe(split()).pipe(through(write, end)))
    d.setWritable(ps.stdin)
    return d
    function write (buf, enc, next) {
      var s = buf.toString('utf8')
      if (/^\s*<osm\b/.test(s)) {
        if (first) next(null, s + '\n' + bounds + '\n')
        else next()
      } else if (/^\s*(?:<bounds|<\/osm)\b/.test(s)) {
        next()
      } else next(null, s + '\n')
      first = false
    }
    function end (next) {
      this.push('</osm>\n')
      next()
    }
  }
}
