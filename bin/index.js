#!/usr/bin/env node

var fs = require('fs')
var path = require('path')
var through = require('through2')
var ecef = require('geodetic-to-ecef')

//var file = path.join(process.env.HOME, 'data/osm/alexandria_egypt.osm.pbf')
var file = path.join(process.env.HOME, 'data/osm/auckland.pbf')
var OSM = require('osm-pbf-parser')

var level = require('level')
var ndb = level('/tmp/peerdb/nodes.db')
var wdb = level('/tmp/peerdb/ways.db', { valueEncoding: 'json' })

var fdstore = require('fd-chunk-store')
var kdbfile = '/tmp/peerdb/output.kdb'

var kdbtree = require('kdb-tree-store')
var kdb = kdbtree({
  types: [ 'float32', 'float32', 'float32' ],
  size: 4096,
  store: fdstore(4096, kdbfile)
})

var osm = OSM()
fs.createReadStream(file)
  .pipe(osm)
  .pipe(through.obj(write))

var tmp = new Buffer(8)
var EventEmitter = require('events').EventEmitter
var em = new EventEmitter
var pending = 0

function write (items, enc, next) {
  items.forEach(function (item) {
    if (item.type === 'node') {
      tmp.writeFloatBE(item.lat, 0)
      tmp.writeFloatBE(item.lon, 4)
      ndb.put(String(item.id), tmp, function (err) {
        if (err) console.error(err)
        else if (--pending === 0) em.emit('ready')
      })
    } else if (item.type === 'way' && pending === 0) {
      way(item)
    } else if (item.type === 'way') {
      em.once('ready', function () { way(item) })
    }
  })
  next()

  function way (item) {
    wdb.put(String(item.id), item.tags, function (err) {
      if (err) console.error(err)
    })

    item.refs.forEach(function (r) {
      ndb.get(String(r), function (err, buf) {
        if (err) return console.error(err)
        var lat = buf.readFloatBE(0)
        var lon = buf.readFloatBE(4)
        var xyz = ecef(lat, lon, 0)
        kdb.insert(xyz, item.id, function (err) {
          if (err) console.error(err)
        })
      })
    })
  }
}
