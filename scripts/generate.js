#!/usr/bin/env node

var path = require('path')
var createTiles = require('./tile.js')

var minimist = require('minimist')
var argv = minimist(process.argv.slice(2), {
  alias: { i: 'infile', o: 'outdir' }
})
createTiles(argv)
