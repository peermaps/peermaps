#!/bin/bash

var path = require('path')
var spawn = require('child_process').spawn

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

;(function next (i) {
  if (i >= grid.length) return
  var g = grid[i]
  var wsen = [ g.xmin, g.ymin, g.xmax, g.ymax ]
  var cmd = [
    'osmconvert',
    argv.infile,
    '-b=' + wsen.join(','),
    '--out-o5m',
    '-o=' + path.join(argv.outdir, i + '.o5m')
  ]
  console.log(cmd.join(' '))
  var ps = spawn(cmd[0], cmd.slice(1))
  ps.stderr.pipe(process.stderr)
  ps.once('exit', function (code) {
    if (code !== 0) process.exit(code)
    else next(i+1)
  })
})(0)
