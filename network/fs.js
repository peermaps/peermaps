var fs = require('fs')
var path = require('path')
module.exports = function (dir) {
  return {
    list: function (p, cb) {
      fs.readdir(path.join(dir,p), cb)
    },
    createReadStream: function (file) {
      return fs.createReadStream(path.join(dir,file))
    },
    address: function (cb) {
      cb(null, dir)
    },
    close: function (cb) {
      if (cb) cb()
    }
  }
}
