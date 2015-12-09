#!/usr/bin/env node

var fs = require('fs')
var path = require('path')
var through = require('through2')
var ecef = require('geodetic-to-ecef')

var file = path.join(process.env.HOME, 'data/osm/alexandria_egypt.osm.pbf')
//var file = path.join(process.env.HOME, 'data/osm/auckland.pbf')
var OSM = require('osm-pbf-parser')

var level = require('level')
var ndb = level('/tmp/peerdb/nodes.db', { valueEncoding: 'binary' })
var wdb = level('/tmp/peerdb/ways.db', { valueEncoding: 'binary' })

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

var EventEmitter = require('events').EventEmitter
var em = new EventEmitter

function write (items, enc, next) {
  var pending = 0
  console.log(items.length)
  items.forEach(function (item) {
    if (item.type === 'node') {
      pending++
      var buf = new Buffer(8)
      buf.writeFloatBE(item.lat, 0)
      buf.writeFloatBE(item.lon, 4)
      ndb.put(String(item.id), buf, function (err) {
        if (err) console.error(err)
        else if (--pending === 0) next()
      })
    } else if (item.type === 'way') {
      way(item)
    }
  })
  if (pending === 0) next()

  function way (item) {
    pending++
    var points = []
    item.refs.forEach(function (r) {
      pending++
      ndb.get(String(r), function (err, buf) {
        if (err) return console.error(err)
        var lat = buf.readFloatBE(0)
        var lon = buf.readFloatBE(4)
        points.push(buf)
        var xyz = ecef(lat, lon, 0)
        kdb.insert(xyz, item.id, function (err) {
          if (err) return console.error(err)
          if (--pending === 0) next()
          if (points.length === item.refs.length) done()
        })
      })
    })
    function done () {
      var s = Buffer(JSON.stringify(item.tags))
      var slen = s.length
      var wbuf = new Buffer(2 + slen + points.length * 2 * 4)
      wbuf.writeUInt16BE(slen, 0)
      s.copy(wbuf, 2)
      for (var i = 0; i < points.length; i++) {
        points[i].copy(wbuf, 2+slen+i*2*4)
      }
      wdb.put(String(item.id), wbuf, function (err) {
        if (err) console.error(err)
        else if (--pending === 0) next()
      })
    }
  }
}
