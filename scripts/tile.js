#!/bin/bash

var path = require('path')
var spawn = require('child_process').spawn
var fs = require('fs')

var minimist = require('minimist')
var argv = minimist(process.argv.slice(2), {
  alias: { i: 'infile', o: 'outdir' }
})

var grid = require('./grid.js')({
  xcount: argv.xcount,
  ycount: argv.ycount,
  xmin: argv.xmin,
  xmax: argv.xmax,
  ymin: argv.ymin,
  ymax: argv.ymax
})

var meta = {}
grid.forEach(function (g, i) {
  meta[i] = [ g.xmin, g.ymin, g.xmax, g.ymax ]
})
var metastr = JSON.stringify(meta)
fs.writeFile(path.join(argv.outdir, 'meta.json'), metastr, function (err) {
  if (err) {
    console.error(err)
    process.exit(1)
  }
})

;(function next (i) {
  if (i >= grid.length) return
  var g = grid[i]
  var wsen = [ g.xmin, g.ymin, g.xmax, g.ymax ]
  var cmd = [
    'osmconvert',
    argv.infile,
    '-b=' + wsen.join(','),
    '--out-o5m'
  ]
  console.log(cmd.join(' '))
  var ps = {
    osmconvert: spawn(cmd[0], cmd.slice(1)),
    gzip: gzip()
  }
  ps.osmconvert.stderr.pipe(process.stderr)

  var outfile = path.join(argv.outdir, i + '.o5m.gz')
  ps.osmconvert.stdout.pipe(ps.gzip.stdin)
  ps.gzip.stdout.pipe(fs.createWriteStream(outfile))

  ps.osmconvert.once('close', function (code) {
    if (code !== 0) process.exit(code)
  })
  ps.gzip.once('close', function (code) {
    if (code !== 0) process.exit(code)
    else next(i+1)
  })
})(0)

function gzip () {
  var ps = spawn('gzip')
  ps.gzip.stderr.pipe(process.stderr)
  return ps
}
