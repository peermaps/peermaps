var boverlap = require('bounding-box-overlap-test')
var tmpa = [[0,0],[0,0]], tmpb = [[0,0],[0,0]]

module.exports = function (a, b) { // wsen overlap test
  tmpa[0][0] = a[0] // w, lon min
  tmpa[0][1] = a[2] // e, lon max
  tmpa[1][0] = a[1] // s, lat min
  tmpa[1][1] = a[3] // n, lat max
  tmpb[0][0] = b[0] // w, lon min
  tmpb[0][1] = b[2] // e, lon max
  tmpb[1][0] = b[1] // s, lat min
  tmpb[1][1] = b[3] // n, lat max
  return boverlap(tmpa, tmpb)
}
