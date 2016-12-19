var from = require('from2')
var through = require('through2')
var concat = require('concat-stream')
var collect = require('collect-stream')
var once = require('once')
var path = require('path')
var pumpify = require('pumpify')
var overlap = require('./lib/overlap.js')
var gunzip = require('zlib').createGunzip
var o5mdecode = require('o5m-decode')
var merge = require('merge-stream')
var onend = require('end-of-stream')

module.exports = Peermaps

function Peermaps (reader) {
  if (!(this instanceof Peermaps)) return new Peermaps(reader)
  this._reader = reader
}

Peermaps.prototype.data = function (wsen) {
  var self = this
  var streaming = 0, queue = []
  var r = self.files(wsen)
  var stream = r.pipe(through.obj(write))
  r.on('error', function (err) { stream.emit('error', err) })
  var stopper = through.obj()
  var mstream = merge(stopper)
  return mstream

  function write (row, enc, next) {
    if (streaming < 100) {
      streaming++
      var s = pumpify.obj(
        self._reader.createReadStream(row.file),
        gunzip(),
        o5mdecode()
      )
      onend(s, end)
      mstream.add(s)
      next()
    } else queue.push([row,enc,next])
  }
  function end (err) {
    if (err) return mstream.emit('error', err)
    streaming--
    if (queue.length) write.apply(null, queue.shift())
    else if (streaming === 0) stopper.end()
  }
}

Peermaps.prototype.files = function (wsen, cb) {
  var r = this._reader
  var outqueue = [], dirqueue = ['']
  var stream = from.obj(read)
  if (cb) collect(stream, cb)
  return stream
  function read (size, next) {
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
  }
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
