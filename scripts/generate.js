#!/usr/bin/env node

var fs = require('fs')
var path = require('path')
var xtend = require('xtend')
var createTiles = require('./tile.js')

var minimist = require('minimist')
var argv = minimist(process.argv.slice(2), {
  alias: { i: 'infile', o: 'outdir', t: 'threshold' },
  boolean: [ 'info' ],
  default: { info: true, remove: false, depth: 0 }
})
compute(argv, function (err) {
  if (err) return error(err)
})

function compute (opts, cb) {
  createTiles(opts, function (err, files) {
    if (err) cb(err)
    else if (opts.remove === true
    || (opts.remove && opts.depth >= opts.remove)) {
      fs.unlink(opts.infile, function (err) {
        if (err) cb(err)
        else onfiles(files)
      })
    } else onfiles(files)
  })
  function onfiles (files) {
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
            depth: opts.depth + 1,
            outdir: dir,
            infile: file.file
          }), next)
        })
      })()
    }
  }
}

function error (err) {
  console.error(err)
  return process.exit(1)
}
