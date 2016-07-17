#!/bin/bash
var nx = Number(process.argv[2])
var ny = Number(process.argv[3])
var xrange = process.argv[4].split(',').map(Number)
var yrange = process.argv[5].split(',').map(Number)
var xspan = xrange[1] - xrange[0]
var yspan = yrange[1] - yrange[0]

var wutil = require('wgs84-util')
var dist = wutil.distanceBetween.bind(wutil)
var table = require('text-table')
var sprintf = require('sprintf')

var data = []
for (var x = 0; x < nx; x++) {
  var x0 = x/nx*360-180
  var x1 = (x+1)/nx*360-180
  for (var y = 0; y < ny; y++) {
    var p0 = (y/ny*2-1)
    var p1 = ((y+1)/ny*2-1)
    var y0 = Math.asin(p0) / Math.PI * 180
    var y1 = Math.asin(p1) / Math.PI * 180

    var bx0 = dist({ coordinates: [x0,y0] }, { coordinates: [x1,y0] }) / 1e3
    var bx1 = dist({ coordinates: [x0,y1] }, { coordinates: [x1,y1] }) / 1e3
    var by0 = dist({ coordinates: [x0,y0] }, { coordinates: [x0,y1] }) / 1e3
    var by1 = dist({ coordinates: [x1,y0] }, { coordinates: [x1,y1] }) / 1e3
    var bx = (bx0 + bx1) / 2
    var by = (by0 + by1) / 2

    var sqkm = bx*by
    data.push([
      sprintf('%.1f',sqkm),
      sprintf('%3.4f',x0),
      sprintf('%3.4f',x1),
      sprintf('%3.4f',y0),
      sprintf('%3.4f',y1),
      sprintf('%4.1f',bx),
      sprintf('%4.1f',by)
    ])
  }
}
console.log(table(data, { align: '.....' }))
