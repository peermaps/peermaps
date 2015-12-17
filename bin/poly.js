var kdbtree = require('kdb-tree-store')
var fdstore = require('fd-chunk-store')

module.exports = function (kdbfile, pt, opts) {
  var kdb = kdbtree({
    types: [ 'float32', 'float32', 'float32', 'buffer[24]' ],
    size: 4096,
    store: fdstore(4096, kdbfile)
  })
  var seen = {}
  kdb.query(pt, function f (err, res) {
    if (err) return console.error(err)
    if (res.length !== 1) return console.error('more than one point')
    console.log(res[0].point)
    seen[res[0].point.join(',')] = true
    var buf = res[0].value
    var prev = [
      buf.readFloatBE(0),
      buf.readFloatBE(4),
      buf.readFloatBE(8)
    ]
    var next = [
      buf.readFloatBE(12),
      buf.readFloatBE(16),
      buf.readFloatBE(20)
    ]
    var pkey = prev.join(',')
    var nkey = next.join(',')
    if (!seen[pkey]) {
      seen[pkey] = true
      kdb.query(prev, f)
    }
    if (!seen[nkey]) {
      seen[nkey] = true
      kdb.query(next, f)
    }
  })
}
