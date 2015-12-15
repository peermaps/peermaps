var spawn = require('child_process').spawn
var fs = require('fs')
var through = require('through2')
var combine = require('stream-combiner2')
var OSM = require('osm-pbf-parser')

module.exports = function (osmfile, opts) {
  var workdir = opts.workdir || '/tmp/peermaps-workdir-' + Math.random()
  var osm = pipeline()
  var index = 0

  fs.createReadStream(osmfile, opts)
      .pipe(osm)
      .pipe(through.obj(write))

  function write (items, enc, next) {
    var offset = osm.offsets[index++]
    items.forEach(function (item, i) {
      console.log(offset, i)
    })
    next()
  }
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
