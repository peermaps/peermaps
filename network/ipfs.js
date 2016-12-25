var fs = require('fs')
var path = require('path')
var api = require('ipfs-api')
var duplexify = require('duplexify')
var link = 'QmXJ8KkgKyjRxTrEDvmZWZMNGq1dk3t97AVhF1Xeov3kB4'

module.exports = function () {
  var ipfs = api()
  return {
    list: function (p, cb) {
      ipfs.ls(path.join(link,p), function (err, res) {
        if (err) cb(err)
        else cb(null, res.Objects[0].Links.map(function (ln) {
          return { name: ln.Name, hash: ln.Hash }
        }))
      })
    },
    createReadStream: function (file) {
      var d = duplexify()
      ipfs.cat(file.hash ? file.hash : path.join(link,file), function (err, r) {
        if (err) d.emit('error', err)
        else d.setReadable(r)
      })
      return d
    },
    address: function (cb) {
      cb(null, link)
    },
    close: function (cb) {
      if (cb) cb()
    }
  }
}
