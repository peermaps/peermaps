#!/usr/bin/env node

var path = require('path')
var spawn = require('child_process').spawn
var fs = require('fs')

module.exports = function (opts, cb) {
  var grid = require('./grid.js')({
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
      console.error(err)
      process.exit(1)
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
    (function next (i, j) {
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
      console.log(cmd.join(' '))
      var ps = {
        osmconvert: spawn(cmd[0], cmd.slice(1)),
        gzip: gzip()
      }
      ps.osmconvert.stderr.pipe(process.stderr)

      var outfile = path.join(opts.outdir, i + '.o5m.gz')
      files.push(outfile)
      ps.osmconvert.stdout.pipe(ps.gzip.stdin)
      ps.gzip.stdout.pipe(fs.createWriteStream(outfile))

      ps.osmconvert.once('close', function (code) {
        if (code !== 0) process.exit(code)
      })
      ps.gzip.once('close', function (code) {
        if (code !== 0) process.exit(code)
        else next(i+1, j)
      })
    })(range[0], range[1])
  })
  if (--pending === 0) cb(null, files)
}

function gzip () {
  var ps = spawn('gzip')
  ps.stderr.pipe(process.stderr)
  return ps
}
