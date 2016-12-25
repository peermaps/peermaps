#!/usr/bin/env node
var minimist = require('minimist')
var args = [], bare = []
for (var i = 2; i < process.argv.length; i++) {
  if (/^-?\d/.test(process.argv[i])) bare.push(process.argv[i])
  else args.push(process.argv[i])
}
var argv = minimist(args.concat('--',bare), {
  alias: { h: 'help', n: 'network' },
  boolean: [ 'show' ],
  default: { network: 'ipfs' }
})

var spawn = require('child_process').spawn
var through = require('through2')

var fs = require('fs')
var path = require('path')
var ospath = require('ospath')
var mkdirp = require('mkdirp')

var network = null
if (argv.network === 'ipfs') {
  network = require('../network/ipfs.js')()
} else if (argv.network === 'dat') {
  network = require('../network/dat.js')(
    argv.dir || path.join(ospath.data(), 'peermaps/dat'))
} else if (argv.network === 'fs') {
  network = require('../network/fs.js')()
}

var peermaps = require('../')({ network: network })
process.stdout.on('error', function () {})

if (argv.help || argv._[0] === 'help') {
  usage(0)
} else if (argv._[0] === 'data') {
  var wsen = argv._.slice(1).join(',').split(',').map(Number)
  //peermaps.data(wsen).pipe(process.stdout)
  var readcmd = argv.network === 'ipfs' ? 'ipfs cat ' : 'peermaps read '
  peermaps.files(wsen, function (err, files) {
    if (err) return error(err)
    var cmd = 'osmconvert -b='+wsen.join(',') + ' '
      + files.map(function (file) {
        return '<(' + readcmd + (file.hash || file) + ')'
      }).join(' ')
    if (argv.show) console.log(cmd)
    else spawn('bash',['-c',cmd], { stdio: 'inherit' })
  })
} else if (argv._[0] === 'files') {
  var wsen = argv._.slice(1).join(',').split(',').map(Number)
  if (argv.full) {
    network.address(function (err, addr) {
      if (err) return error(err)
      showFiles(addr + '/')
    })
  } else showFiles('')

  function showFiles (prefix) {
    peermaps.files(wsen).pipe(through.obj(function (row, enc, next) {
      next(null, prefix + row.name + '\n')
    })).pipe(process.stdout)
  }
} else if (argv._[0] === 'read') {
  peermaps.createReadStream(argv._[1]).pipe(process.stdout)
} else if (argv._[0] === 'address') {
  network.address(function (err, addr) {
    if (err) return error(err)
    console.log(addr)
    network.close()
  })
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
