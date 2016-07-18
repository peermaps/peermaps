#!/usr/bin/env node

var fs = require('fs')
var path = require('path')
var xtend = require('xtend')
var createTiles = require('./tile.js')

var minimist = require('minimist')
var argv = minimist(process.argv.slice(2), {
  alias: { i: 'infile', o: 'outdir', t: 'threshold' },
  default: { info: true }
})
compute(argv, function (err) {
  if (err) return error(err)
})

function compute (opts, cb) {
  createTiles(opts, function onfiles (err, files) {
    if (err) return cb(err)
    var pending = 1 + files.length
    var divide = []
    files.forEach(function (file) {
      fs.stat(file.file, function (err, stat) {
        if (err) return cb(err)
        if (stat.size > opts.threshold) {
          divide.push(file)
        }
        if (--pending === 0) done()
      })
    })
    if (--pending === 0) done()

    function done () {
      ;(function next () {
        if (divide.length === 0) return cb()
        var file = divide.shift()
        console.log('SUBDIVIDE', file.file, file.i)
        var dir = path.join(opts.outdir, String(file.i))
        fs.mkdir(dir, function (err) {
          if (err) return cb(err)
          compute(xtend(xtend(opts, file), {
            outdir: dir,
            infile: file.file
          }), next)
        })
      })()
    }
  })
}

function error (err) {
  console.error(err)
  return process.exit(1)
}
