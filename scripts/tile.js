#!/usr/bin/env node

var path = require('path')
var spawn = require('child_process').spawn
var fs = require('fs')
var once = require('once')
var xtend = require('xtend')
var Grid = require('./grid.js')

module.exports = function (opts, cb) {
  cb = once(cb || noop)
  var cancel = false
  var grid = Grid({
    xcount: opts.xcount,
    ycount: opts.ycount,
    xmin: opts.xmin,
    xmax: opts.xmax,
    ymin: opts.ymin,
    ymax: opts.ymax
  })
  var meta = {}
  grid.forEach(function (g, i) {
    meta[i] = [ g.xmin, g.ymin, g.xmax, g.ymax ]
  })
  var metastr = JSON.stringify(meta)
  fs.writeFile(path.join(opts.outdir, 'meta.json'), metastr, function (err) {
    if (err) {
      cancel = true
      return cb(err)
    }
  })

  var nproc = opts.nproc || 1
  var offsets = []
  for (var n = 0; n < nproc; n++) {
    var i = Math.floor(n*grid.length/nproc)
    var j = Math.floor((n+1)*grid.length/nproc)
    offsets.push([i,j])
  }

  var pending = 1 + offsets.length, files = []
  offsets.forEach(function (range) {
    if (cancel) return
    (function next (i, j) {
      if (cancel) return
      if (i >= j) {
        if (--pending === 0) cb(null, files)
        return
      }
      var g = grid[i]
      var wsen = [ g.xmin, g.ymin, g.xmax, g.ymax ]
      var cmd = [
        'osmconvert',
        opts.infile,
        '-b=' + wsen.join(','),
        '--out-o5m'
      ]
      if (opts.info) console.error(cmd.join(' '))
      var ps = {
        osmconvert: spawn(cmd[0], cmd.slice(1)),
        gzip: gzip()
      }
      if (opts.info) ps.osmconvert.stderr.pipe(process.stderr)

      var outfile = path.join(opts.outdir, i + '.o5m.gz')
      files.push(xtend(g, { file: outfile, i: i }))
      ps.osmconvert.stdout.pipe(ps.gzip.stdin)
      ps.gzip.stdout.pipe(fs.createWriteStream(outfile))

      ps.osmconvert.once('close', function (code) {
        if (code !== 0) {
          cancel = true
          cb(new Error('non-zero exit code from osmconvert'))
        }
      })
      ps.gzip.once('close', function (code) {
        if (code !== 0) {
          cancel = true
          cb(new Error('non-zero exit code from gzip'))
        } else next(i+1, j)
      })
    })(range[0], range[1])
  })
  if (--pending === 0) cb(null, files)

  function gzip () {
    var ps = spawn('gzip')
    if (opts.info) ps.stderr.pipe(process.stderr)
    return ps
  }
}
function noop () {}
