var PI = Math.PI
var sin = Math.sin, asin = Math.asin

module.exports = function compute (opts) {
  var nx = opts.xcount
  var ny = opts.ycount
  var xmin = opts.xmin
  var xmax = opts.xmax
  var ymin = opts.ymin
  var ymax = opts.ymax
  var xspan = xmax - xmin
  var yspan = ymax - ymin
  var zmin = sin(ymin*PI/180)
  var zmax = sin(ymax*PI/180)

  var grid = []
  for (var x = 0; x < nx; x++) {
    var x0 = xmin + x/nx*xspan
    var x1 = xmin + (x+1)/nx*xspan
    for (var y = 0; y < ny; y++) {
      var p0 = f(y)
      var p1 = f(y+1)
      var y0 = asin(p0) / PI * 180
      var y1 = asin(p1) / PI * 180
      grid.push({ xmin: x0, xmax: x1, ymin: y0, ymax: y1 })
    }
  }
  return grid
  function f (y) { return y/ny*(zmax-zmin)+zmin }
}
