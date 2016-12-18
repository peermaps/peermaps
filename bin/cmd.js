#!/usr/bin/env node

var minimist = require('minimist')
var args = [], bare = []
for (var i = 2; i < process.argv.length; i++) {
  if (/^-\d/.test(process.argv[i])) bare.push(process.argv[i])
  else args.push(process.argv[i])
}
var argv = minimist(args.concat('--',bare), {
  alias: { h: 'help' }
})

var through = require('through2')
var fs = require('fs')
var path = require('path')
var dir = '/home/substack/data/osmtiles'
var peermaps = require('../')({
  list: function (p, cb) {
    fs.readdir(path.join(dir,p), cb)
  },
  createReadStream: function (file) {
    return fs.createReadStream(path.join(dir,file))
  }
})
process.stdout.on('error', function () {})

if (argv.help || argv._[0] === 'help') {
  usage(0)
} else if (argv._[0] === 'data') {
  var wsen = argv._[1].split(',').map(Number)
} else if (argv._[0] === 'files') {
  var wsen = argv._[1].split(',').map(Number)
  peermaps.files(wsen).pipe(through.obj(function (row, enc, next) {
    next(null, row.file + '\n')
  })).pipe(process.stdout)
} else usage(1)

function usage (code) {
  var r = fs.createReadStream(path.join(__dirname, 'usage.txt'))
  r.pipe(process.stdout)
  if (code) r.once('end', function () { process.exit(code) })
}
