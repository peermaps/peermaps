var kdbtree = require('kdb-tree-store')
var fdstore = require('fd-chunk-store')

module.exports = function (kdbfile, query, opts) {
  var kdb = kdbtree({
    types: [ 'float32', 'float32', 'float32', 'buffer[24]' ],
    size: 4096,
    store: fdstore(4096, kdbfile)
  })
  kdb.queryStream(query).on('data', console.log)
}
