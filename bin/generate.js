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

module.exports = function (osmfile, opts) {
  var workdir = opts.workdir || '/tmp/peermaps-workdir-' + Math.random()
  console.log(workdir)

  mkdirp(workdir, function (err) {
    var osm = pipeline()
    var index = 0
    /*
    var kdbfile = path.join(workdir, 'kdb')
    var kdb = kdbtree({
      types: [ 'float32', 'float32', 'float32', 'buffer[24]' ],
      size: 4096,
      store: fdstore(4096, kdbfile)
    })
    */
    var db = level(path.join(workdir, 'db'))

    fs.createReadStream(osmfile, opts)
      .pipe(osm)
      .pipe(through.obj(write))

    function write (items, enc, next) {
      var offset = osm.offsets[index++]
      var ops = items.map(function (item, i) {
        if (item.type === 'node') {
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
          //console.log(item.id, offset)
          //console.log(offset, i, xyz)
        }
      }).filter(Boolean)
      db.batch(ops, function (err) {
        if (err) console.error(err)
      })
      next()
    }
  })
}

function pipeline () {
  var b = new OSM.BlobParser
  var d = new OSM.BlobDecompressor
  var p = new OSM.PrimitivesParser
  var stream = combine.obj([ b, through.obj(write), d, p ])
  stream.blob = b
  stream.decompressor = d
  stream.primitives = p
  stream.offsets = []
  return stream

  function write (chunk, enc, next) {
    if (chunk.type === 'OSMData') {
      stream.offsets.push(chunk.offset)
    }
    next(null, chunk)
  }
}
