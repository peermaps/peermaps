module.exports = function (opts) {
  var nx = opts.xcount
  var ny = opts.ycount
  var xmin = opts.xmin
  var xmax = opts.xmax
  var ymin = opts.ymin
  var ymax = opts.ymax
  var xspan = xmax - xmin
  var yspan = ymax - ymin

  var grid = []
  for (var x = 0; x < nx; x++) {
    var x0 = x/nx*360-180
    var x1 = (x+1)/nx*360-180
    for (var y = 0; y < ny; y++) {
      var p0 = (y/ny*2-1)
      var p1 = ((y+1)/ny*2-1)
      var y0 = Math.asin(p0) / Math.PI * 180
      var y1 = Math.asin(p1) / Math.PI * 180
      grid.push({
        xmin: x0,
        xmax: x1,
        ymin: y0,
        ymax: y1
      })
    }
  }
  return grid
}
