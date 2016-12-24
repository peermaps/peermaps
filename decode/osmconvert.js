var spawn = require('child_process').spawn
var duplexify = require('duplexify')
var pumpify = require('pumpify')
var xmlwrap = require('../lib/xmlwrap.js')

module.exports = function () {
  return {
    stream: function (wsen) {
      var ps = spawn('osmconvert',['-','-b='+wsen.join(',')])
      var d = duplexify()
      var first = true
      d.setReadable(ps.stdout)
      d.setWritable(ps.stdin)
      return d
    },
    wrap: xmlwrap
  }
}
