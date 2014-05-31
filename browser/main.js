var sock = require('shoe')('/sock');
var through = require('through2');
var Map = require('./map.js');

var map = Map().appendTo(document.body);
sock.pipe(through.obj(function (str, enc, next) {
    var row = JSON.parse(str);
console.log('row=', row);
    map.plot(row.points);
    process.nextTick(next);
}));
