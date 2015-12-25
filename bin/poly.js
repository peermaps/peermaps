var kdbtree = require('kdb-tree-store')
var fdstore = require('fd-chunk-store')

module.exports = function (kdbfile, pt, opts) {
  var kdb = kdbtree({
    types: [ 'float32', 'float32', 'float32', 'buffer[24]' ],
    size: 4096,
    store: fdstore(4096, kdbfile)
  })
  var seen = {}
  kdb.query(pt, function (err, res) {
    ;(function next () {
      if (res.length === 0) return
      var r = res.shift(), v = r.value
      var wayId = v.readUInt32BE(0)
      console.log(wayId)
      console.log('  ' + r.point.join(' '))
      seen[wayId] = {}
      seen[wayId][r.point.join(',')] = true
      var pt = [ v.readFloatBE(4), v.readFloatBE(8), v.readFloatBE(12) ]
      showPts(wayId, pt, next)
    })()
  })

  function showPts (wayId, pt, cb) {
    kdb.query(pt, onpts)
    function onpts (err, pts) {
      if (err) return console.error(err)
      var xpts = pts
        .filter(function (p) { return p.readUInt32BE(0) === wayId })
        .map(function (p) {
          return [ p.readFloatBE(4), p.readFloatBE(8), p.readFloatBE(12) ]
        })
        .filter(function (p) { return !seen[p.join(',')] })

      if (xpts.length === 0) return cb()
      console.log('  ' + xpts[0].join(' '))
      seen[wayId][xpts[0].join(',')] = true
      kdb.query(xpts[0], onpts)
    }
  }
}
