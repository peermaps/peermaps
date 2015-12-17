var spawn = require('child_process').spawn
var fs = require('fs')
var path = require('path')
var through = require('through2')
var combine = require('stream-combiner2')
var OSM = require('osm-pbf-parser')
var ecef = require('geodetic-to-ecef')
var mkdirp = require('mkdirp')
var kdbtree = require('kdb-tree-store')
var fdstore = require('fd-chunk-store')
var level = require('level')

var NODES = 1, WAYS = 2, RELATIONS = 3

module.exports = function (osmfile, opts) {
  var workdir = opts.workdir || '/tmp/peermaps-workdir-' + Math.random()
  console.log(workdir)

  mkdirp(workdir, function (err) {
    if (err) console.error(err)
    process(workdir)
  })

  function process (workdir) {
    var db = level(path.join(workdir, 'db'), { valueEncoding: 'binary' })
    var osm = OSM()
    var limit = 200 * 1000
    var kdbfile = path.join(workdir, 'kdb')
    var kdb = kdbtree({
      types: [ 'float32', 'float32', 'float32', 'buffer[24]' ],
      size: 4096,
      store: fdstore(4096, kdbfile)
    })
    var mode = NODES

    fs.createReadStream(osmfile, opts)
      .pipe(osm)
      .pipe(through.obj(write))

    function write (items, enc, next) {
      if (mode === WAYS) return writeWay(items, enc, next)
      if (mode === RELATIONS) return next()

      ;(function store (offset) {
        if (offset >= items.length) return next()

        var ops = []
        for (var i = offset; i < items.length && ops.length < limit; i++) {
          if (items[i].type === 'node') {
            ops.push(nodeRecord(items[i]))
          } else if (items[i].type === 'way') {
            mode = WAYS
            return writeWay(i === 0 ? items : items.slice(i), enc, next)
          }
        }
        if (ops.length) db.batch(ops, function (err) {
          if (err) console.error(err)
          store(offset+limit)
        })
      })(0)
    }
    function writeWay (items, enc, next) {
      var pending = 0
      items.forEach(function (item) {
        if (mode === RELATIONS) return
        if (item.type === 'relation') {
          mode = RELATIONS
          // todo: relations
          return
        }
        if (item.type !== 'way') {
          return next(new Error('unexpected non-way type'))
        }

        pending++
        var nodes = [], bufs = []
        var ipending = item.refs.length
        item.refs.forEach(function (ref, ix) {
          db.get(String(ref), function (err, buf) {
            if (err) console.error(err)
            var xyz = [
              buf.readFloatBE(0),
              buf.readFloatBE(4),
              buf.readFloatBE(8)
            ]
            nodes[ix] = xyz
            bufs[ix] = buf
            if (--ipending === 0) done()
          })
        })

        function done () {
          nodes.forEach(function (node, i) {
            // key: [current xyz]
            // value: [prev xyz] [next xyz]
            var value = new Buffer(24)
            bufs[(i+nodes.length-1)%nodes.length].copy(value)
            bufs[(i+1)%nodes.length].copy(value, 12)
            kdb.insert(node, value, function (err) {
              if (err) console.error(err)
              if (--pending === 0) next()
            })
          })
        }
      })
      if (pending === 0) next()
    }
  }
}

function nodeRecord (item) {
  var xyz = ecef(item.lat, item.lon, 0)
  var buf = new Buffer(12)
  buf.writeFloatBE(xyz[0], 0)
  buf.writeFloatBE(xyz[1], 4)
  buf.writeFloatBE(xyz[2], 8)
  return {
    type: 'put',
    key: String(item.id),
    value: buf
  }
}
