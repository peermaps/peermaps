var fs = require('fs');
var zlib = require('zlib');
var through = require('through2');
var parsers = require('./lib/parsers.js');

var mode = 'size';
var waiting = 4;
var prev;
var header;

fs.createReadStream('/home/substack/osm')
    .pipe(through(write))
;

function write (buf, enc, next) {
    if (prev) {
        buf = Buffer.concat([ prev, buf ]);
        prev = null;
    }
    if (buf.length < waiting) {
        prev = buf;
        return next();
    }
    
    if (mode === 'size') {
        var len = buf.readUInt32BE(0);
//console.log('SIZE', len);
        mode = 'header';
        waiting = len;
        write(buf.slice(4), enc, next);
    }
    else if (mode === 'header') {
        header = parsers.header.decode(buf.slice(0, waiting));
//console.log('HEADER', header);
        mode = 'blob';
        var nbuf = buf.slice(waiting);
        waiting = header.datasize;
        write(nbuf, enc, next);
    }
    else if (mode === 'blob') {
        var blob = parsers.blob.decode(buf.slice(0, waiting));
//console.log('BLOB', header.type, blob);
        
        var h = header;
        zlib.inflate(blob.zlib_data, function (err, data) {
            console.log(err, data, h);
            if (h.type === 'OSMHeader') {
                var osmh = parsers.osmheader.decode(data);
                console.log('OSM HEADER', osmh);
            }
            else if (h.type === 'OSMData') {
                var osmd = parsers.osmdata.decode(data);
                console.log('OSM DATA', osmd);
            }
        });
        
        mode = 'size';
        var nbuf = buf.slice(waiting);
        waiting = 4;
        write(nbuf, enc, next);
    }
}

//var b = blob.decode(buf.slice(4+slice.length, 4+slice.length+115));
//zlib.inflate(b.zlib_data, function(err, data) {
//  console.log(osmheader.decode(data))
//})
