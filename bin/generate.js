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
    if (err) console.error(err)
    work(workdir)
  })

  function work (workdir) {
    var db = level(path.join(workdir, 'db'))
    var osm = OSM()
    var limit = 200 * 1000
    var kdbfile = path.join(workdir, 'kdb')
    var kdb = kdbtree({
      types: [ 'float32', 'float32', 'float32', 'buffer[28]' ],
      size: 4096,
      store: fdstore(4096, kdbfile)
    })

    fs.createReadStream(osmfile, opts)
      .pipe(osm)
      .pipe(through.obj(writeWay))

    function writeWay (items, enc, next) {
      if (items[0].type === 'node') {
        ;(function advance (err) {
          if (err) return next(err)
          if (items.length === 0) return next()
          var xitems = items.splice(0, 100)
          db.batch(xitems.map(function (item) {
            return {
              type: 'put',
              key:'n!' + item.id,
              value: item.lat + ',' + item.lon
            }
          }), advance)
        })()
      } else if (items[0].type === 'way') {
        ;(function advance (err) {
          if (err) return next(err)
          if (items.length === 0) return next()
          var item = items.shift()
          var len = item.refs.length
          var pending = 0
          item.refs.forEach(function (ref, i) {
            var n = item.refs[(i+1)%len]
            var p = item.refs[(i-1+len)%len]
            pending++
            var xpending = 3
            var results = {}
            db.get('n!' + n, function (err, value) {
              results.next = value.split(',')
              if (--xpending === 0) done()
            })
            db.get('n!' + p, function (err, value) {
              results.prev = value.split(',')
              if (--xpending === 0) done()
            })
            db.get('n!' + ref, function (err, value) {
              results.current = value.split(',')
              if (--xpending === 0) done()
            })
            function done () {
              var buf = new Buffer(28)
              var ne = ecef(results.next[0], results.next[1])
              var pe = ecef(results.prev[0], results.prev[1])
              var ce = ecef(results.current[0], results.current[1])
              buf.writeUInt32BE(item.id, 0)
              buf.writeFloatBE(pe[0], 4)
              buf.writeFloatBE(pe[1], 8)
              buf.writeFloatBE(pe[2], 12)
              buf.writeFloatBE(ne[0], 16)
              buf.writeFloatBE(ne[1], 20)
              buf.writeFloatBE(ne[2], 24)
              kdb.insert(ce, buf, function (err) {
                if (err) console.error(err)
              })
              if (--pending === 0) advance()
            }
          })
        })()
      } else next()
    }
  }
}
