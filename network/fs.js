var fs = require('fs')
var path = require('path')
module.exports = function (dir) {
  return {
    list: function (p, cb) {
      fs.readdir(path.join(dir,p), cb)
    },
    createReadStream: function (file) {
      return fs.createReadStream(path.join(dir,file))
    }
  }
}
