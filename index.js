var from = require('from2')
var concat = require('concat-stream')
var collect = require('collect-stream')
var once = require('once')
var path = require('path')
var overlap = require('./lib/overlap.js')
var merge = require('merge-stream')

module.exports = Peermaps

function Peermaps (opts) {
  if (!(this instanceof Peermaps)) return new Peermaps(opts)
  this._network = opts.network
}

Peermaps.prototype.files = function (wsen, cb) {
  var r = this._network
  var outqueue = [], dirqueue = ['']
  var stream = from.obj(read)
  if (cb) collect(stream, cb)
  return stream
  function read (size, next) {
    if (outqueue.length > 0) return next(null, outqueue.shift())
    else if (dirqueue.length === 0) return next(null, null)
    next = once(next)
    var dir = dirqueue.shift()
    r.list(dir, function (err, files) {
      if (err) return next(err)
      var metafile = null
      for (var i = 0; i < files.length; i++) {
        if (files[i].name === 'meta.json') {
          metafile = files[i]
          break
        }
      }
      if (!metafile) return cb(new Error('meta.json not found'))
      json(r, metafile, function (err, meta) {
        if (err) return next(err)
        done(files, meta)
      })
    })
    function done (files, meta) {
      var matches = {}
      Object.keys(meta).forEach(function (m) {
        if (overlap(meta[m], wsen)) matches[m] = true
      })
      files.forEach(function (file) {
        var m = /^(\d+)(?:\.o5m\.gz)?$/.exec(file.name)
        if (!m || !matches[m[1]]) return
        if (/\.o5m\.gz$/.test(file.name)) {
          outqueue.push(Object.assign({}, file, { name: path.join(dir,file.name) }))
        } else {
          dirqueue.push(path.join(dir,file.name))
        }
      })
      read(size, next)
    }
  }
}

Peermaps.prototype.createReadStream = function (file) {
  return this._network.createReadStream(file)
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
