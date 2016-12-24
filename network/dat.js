var path = require('path')
var mkdirp = require('mkdirp')
var createSwarm = require('hyperdiscovery')
var hyperdrive = require('hyperdrive')
var level = require('level')
var filestore = require('random-access-file')
var duplexify = require('duplexify')
var concat = require('concat-stream')
var once = require('once')

var link = '04ed0b08ff595a992a594ad1ab624072646467ec7eda2dc40e4aa512e49cb196'

module.exports = function (dir) {
  var dbdir = path.join(dir,'db')
  var datadir = path.join(dir,'data')
  var archive = null, queue = []
  mkdirp(dbdir, function () {
    var drive = hyperdrive(level(dbdir))
    archive = drive.createArchive(Buffer(link,'hex'), {
      sparse: true,
      file: function (name) {
        return filestore(path.join(datadir,name))
      }
    })
    queue.forEach(function (q) { q(archive) })
    queue = []
    var swarm = createSwarm(archive)
    swarm.on('connection', function (c) {
      //console.error('connection')
    })
  })
  return {
    list: function (p, cb) {
      cb = once(cb || noop)
      getArchive(function (archive) {
        var r = archive.createFileReadStream(path.join(p,'meta.json'))
        r.on('error', cb)
        r.pipe(concat({ encoding: 'string' }, function (body) {
          console.log('meta.json=', body)
        }))
        /*
        archive.list({ live: false }, function (err, entries) {
          if (err) return cb(err)
          var results = {}
          entries.forEach(function (entry) {
            var r = path.relative(p, entry.name)
            if (/^\.\./.test(r)) return
            results[r.split('/')[0]] = true
          })
          cb(null, Object.keys(results))
        })
        */
      })
    },
    createReadStream: function (file) {
      var d = duplexify()
      getArchive(function (archive) {
        var r = archive.createFileReadStream(file)
        r.on('error', function (err) { d.emit('error', err) })
        d.setReadable(r)
      })
      return d
    }
  }
  function getArchive (f) {
    if (archive) f(archive)
    else queue.push(f)
  }
}

function noop () {}
