#!/usr/bin/env node

var fs = require('fs');
var http = require('http');
var ecstatic = require('ecstatic');
var through = require('through2');

var file = __dirname + '/../data/planet-140514.osm.pbf.torrent';
var torrentFile = fs.readFileSync(file);

var parseOSM = require('osm-pbf-parser');

var torrentStream = require('torrent-stream');
var engine = torrentStream(torrentFile);

var ready = false;
engine.once('ready', function () { ready = true });

var st = ecstatic(__dirname + '/../static');
var server = http.createServer(function (req, res) {
    st(req, res);
});
server.listen(5000);

var shoe = require('shoe');
var sock = shoe(function onready (stream) {
    if (!ready) return engine.once('ready', onready);
    
    var rs = engine.files[0].createReadStream();
    console.log(engine.files);
    //var rs = fs.createReadStream('/home/substack/osm');
    var topts = { highWaterMark: 16 };
    rs.pipe(parseOSM()).pipe(through.obj(topts, function (row, enc, next) {
        this.push(JSON.stringify(row) + '\n');
        setTimeout(next, 100);
    })).pipe(stream);
});
sock.install(server, '/sock');
