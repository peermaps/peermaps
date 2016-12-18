var from = require('from2')
var concat = require('concat-stream')
var once = require('once')
var path = require('path')
var overlap = require('./lib/overlap.js')

module.exports = Peermaps

function Peermaps (reader) {
  if (!(this instanceof Peermaps)) return new Peermaps(reader)
  this._reader = reader
}

Peermaps.prototype.files = function (wsen) {
  var r = this._reader
  var outqueue = [], dirqueue = ['']
  return from.obj(function read (size, next) {
    if (outqueue.length > 0) return next(null, { file: outqueue.shift() })
    else if (dirqueue.length === 0) return next(null, null)
    next = once(next)
    var pending = 2, files = null, meta = null
    var dir = dirqueue.shift()
    r.list(dir, function (err, x) {
      if (err) return next(err)
      files = x
      if (--pending === 0) done()
    })
    json(r, path.join(dir,'meta.json'), function (err, x) {
      if (err) return next(err)
      meta = x
      if (--pending === 0) done()
    })
    function done () {
      var matches = {}
      Object.keys(meta).forEach(function (m) {
        if (overlap(meta[m], wsen)) matches[m] = true
      })
      files.forEach(function (file) {
        var m = /^(\d+)(?:\.o5m\.gz)?$/.exec(file)
        if (!m || !matches[m[1]]) return
        if (/\.o5m\.gz$/.test(file)) {
          outqueue.push(path.join(dir,file))
        } else {
          dirqueue.push(path.join(dir,file))
        }
      })
      read(size, next)
    }
  })
}

function json (r, file, cb) {
  cb = once(cb)
  var s = r.createReadStream(file)
  s.on('error', cb)
  s.pipe(concat({ encoding: 'string' }, function (src) {
    try { var data = JSON.parse(src) }
    catch (err) { return cb(err) }
    cb(null, data)
  }))
}
