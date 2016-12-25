#!/usr/bin/env node
var minimist = require('minimist')
var args = [], bare = []
for (var i = 2; i < process.argv.length; i++) {
  if (/^-?[\d\.,]+$/.test(process.argv[i])) bare.push(process.argv[i])
  else args.push(process.argv[i])
}
var argv = minimist(args.concat('--',bare), {
  alias: {
    h: 'help', n: 'network', f: 'format',
    i: 'infile', o: ['outfile','outdir'], t: 'threshold'
  },
  boolean: [ 'show' ],
  default: { network: 'ipfs' }
})

var spawn = require('child_process').spawn
var through = require('through2')

var fs = require('fs')
var path = require('path')
var ospath = require('ospath')
var nproc = require('os').cpus
var mkdirp = require('mkdirp')
var defined = require('defined')

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
  var readcmd = argv.network === 'ipfs' ? 'ipfs cat ' : 'peermaps read '
  var format = argv.format || 'osm'
  if (!/^(osm|osc|osh|o5m|o5c|pbf|csv)$/.test(format)) {
    return error('unrecognized format: ' + format)
  }
  peermaps.files(wsen, function (err, files) {
    if (err) return error(err)
    var cmd = 'osmconvert -b='+wsen.join(',')
      + (argv.format ? ' --out-' + format : '')
      + ' ' + files.map(function (file) {
        return '<(' + readcmd + (file.hash || file) + ')'
      }).join(' ')
    if (argv.show) console.log(cmd)
    else spawn('bash',['-c',cmd], { stdio: 'inherit' })
  })
} else if (argv._[0] === 'files') {
  var wsen = argv._.slice(1).join(',').split(',').map(Number)
  function showFiles () {
    peermaps.files(wsen).pipe(through.obj(function (row, enc, next) {
      next(null, row.name + '\n')
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
} else if (argv._[0] === 'generate') {
  var wsen = argv.extents ? argv.extents.split(/[ ,]/).map(Number) : []
  mkdirp(argv.outdir, function (err) {
    if (err) return error(err)
    require('../lib/generate')({
      debug: argv.debug !== false,
      infile: argv._[1] || argv.infile,
      threshold: inbytes(argv.threshold || '1M'),
      outdir: argv.outdir,
      remove: 1,
      xmin: defined(argv.xmin, wsen[0], -180),
      xmax: defined(argv.xmax, wsen[2], 180),
      ymin: defined(argv.ymin, wsen[1], -90),
      ymax: defined(argv.ymax, wsen[3], 90),
      xcount: argv.xcount || 4,
      ycount: argv.ycount || 4,
      nproc: argv.nproc || nproc()-1
    }, function (err) {
      network.close()
      if (err) error(err)
    })
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

function inbytes (str) {
  if (/kb?$/i.test(str)) return Number(str.replace(/kb?$/i,''))*1024
  if (/mb?$/i.test(str)) return Number(str.replace(/mb?$/i,''))*1024*1024
  if (/gb?$/i.test(str)) return Number(str.replace(/gb?$/i,''))*1024*1024*1024
  return Number(str)
}
