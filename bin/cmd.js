#!/usr/bin/env node
var minimist = require('minimist')
var args = [], bare = []
for (var i = 2; i < process.argv.length; i++) {
  if (/^-?\d/.test(process.argv[i])) bare.push(process.argv[i])
  else args.push(process.argv[i])
}
var argv = minimist(args.concat('--',bare), {
  alias: { h: 'help', d: 'decode', n: 'network' },
  default: { network: 'ipfs', decode: 'js' }
})

var spawn = require('child_process').spawn
var through = require('through2')

var fs = require('fs')
var path = require('path')
var ospath = require('ospath')
var mkdirp = require('mkdirp')

var decode = null
if (argv.decode === 'js') {
  decode = require('../decode/js.js')(argv)
} else if (argv.decode === 'osmconvert') {
  decode = require('../decode/osmconvert.js')(argv)
} else {
  return error('unsupported decoder')
}
var network = null
if (argv.network === 'ipfs') {
  network = require('../network/ipfs.js')()
} else if (argv.network === 'dat') {
  network = require('../network/dat.js')()
} else if (argv.network === 'fs') {
  network = require('../network/fs.js')()
}

var peermaps = require('../')({ network: network, decode: decode })
process.stdout.on('error', function () {})

if (argv.help || argv._[0] === 'help') {
  usage(0)
} else if (argv._[0] === 'data') {
  var wsen = argv._.slice(1).join(',').split(',').map(Number)
  peermaps.data(wsen).pipe(process.stdout)
} else if (argv._[0] === 'files') {
  var wsen = argv._.slice(1).join(',').split(',').map(Number)
  peermaps.files(wsen).pipe(through.obj(function (row, enc, next) {
    next(null, row.name + '\n')
  })).pipe(process.stdout)
} else usage(1)

function usage (code) {
  var r = fs.createReadStream(path.join(__dirname, 'usage.txt'))
  r.pipe(process.stdout)
  if (code) r.once('end', function () { process.exit(code) })
}

function error (err) {
  console.error(err)
  process.exit(1)
}
