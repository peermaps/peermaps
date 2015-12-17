#!/usr/bin/env node

var fs = require('fs')
var path = require('path')
var minimist = require('minimist')
var argv = minimist(process.argv.slice(2), {
  alias: { h: 'help' }
})

if (argv.help || argv._[0] === 'help') {
  usage(0)
} else if (argv._[0] === 'generate' && argv._.length >= 2) {
  require('./generate.js')(argv._[1], argv)
} else if (argv._[0] === 'query') {
  require('./query.js')(argv._[1], argv._.slice(2).map(splitn), argv)
} else if (argv._[0] === 'poly') {
  require('./poly.js')(argv._[1], argv._.slice(2).map(Number), argv)
} else usage(1)

function usage (code) {
  var r = fs.createReadStream(path.join(__dirname, 'usage.txt'))
  r.pipe(process.stdout)
  if (code) r.once('end', function () { process.exit(code) })
}
function splitn (x) {
  return x.split(',').map(Number)
}
