#!/bin/bash

var wutil = require('wgs84-util')
var dist = wutil.distanceBetween.bind(wutil)
var table = require('text-table')
var sprintf = require('sprintf')

var xrange = process.argv[4].split(',').map(Number)
var yrange = process.argv[5].split(',').map(Number)

var grid = require('./grid.js')({
  xcount: Number(process.argv[2]),
  ycount: Number(process.argv[3]),
  xmin: xrange[0],
  xmax: xrange[1],
  ymin: yrange[0],
  ymax: yrange[1]
})

var data = grid.map(function (g) {
  var x0 = g.xmin, x1 = g.xmax, y0 = g.ymin, y1 = g.ymax
  var bx0 = dist({ coordinates: [x0,y0] }, { coordinates: [x1,y0] }) / 1e3
  var bx1 = dist({ coordinates: [x0,y1] }, { coordinates: [x1,y1] }) / 1e3
  var by0 = dist({ coordinates: [x0,y0] }, { coordinates: [x0,y1] }) / 1e3
  var by1 = dist({ coordinates: [x1,y0] }, { coordinates: [x1,y1] }) / 1e3
  var bx = (bx0 + bx1) / 2
  var by = (by0 + by1) / 2
  var sqkm = bx*by
  return [
    sprintf('%.1f',sqkm),
    sprintf('%3.4f',x0),
    sprintf('%3.4f',x1),
    sprintf('%3.4f',y0),
    sprintf('%3.4f',y1),
    sprintf('%4.1f',bx),
    sprintf('%4.1f',by)
  ]
})
console.log(table(data, { align: '.....' }))
