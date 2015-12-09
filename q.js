var kdbtree = require('kdb-tree-store')
var fdstore = require('fd-chunk-store')
var through = require('through2')

var file = '/tmp/peerdb/output.kdb'
var kdb = kdbtree({
  types: [ 'float32', 'float32', 'float32' ],
  size: 4096,
  store: fdstore(4096, file)
})
var level = require('level')
var wdb = level('/tmp/peerdb/ways.db', { valueEncoding: 'binary' })

var q = process.argv.slice(2).map(function (x) {
  return x.split(',').map(Number)
})
kdb.queryStream(q).pipe(through.obj(function (row, enc, next) {
  wdb.get(row.value, function (err, buf) {
    if (err) return console.error(err)
    var tlen = buf.readUInt16BE(0)
    var tags = JSON.parse(buf.slice(2, tlen+2).toString('utf8'))
    var points = []
    for (var i = 2 + tlen; i < buf.length; i += 2 * 4) {
      points.push([ buf.readFloatBE(i), buf.readFloatBE(i+4) ])
    }
    console.log(tags, points)
  })
  next()
}))
