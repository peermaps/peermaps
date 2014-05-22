var fs = require('fs');
var protobuf = require('protocol-buffers');
var through = require('through2');

// first:
// int64 big endian, length of blob header

var blobHeader = protobuf([
    {
        name: 'type',
        type: 'string',
        tag: 1
    },
    {
        name: 'indexdata',
        type: 'bytes',
        tag: 2
    },
    {
        name: 'datasize',
        type: 'int32',
        tag: 3
    }
]);

var blob = protobuf([
    {
        name: 'raw',
        type: 'bytes',
        tag: 1
    },
    {
        name: 'raw_size',
        type: 'int32',
        tag: 2
    },
    {
        name: 'zlib_data',
        type: 'bytes',
        tag: 3
    }
]);

var decoder = {
    header: blobHeader.createDecodeStream(),
    blob: blob.createDecodeStream()
};

var header;
decoder.header.pipe(through.obj(function (row, enc, next) {
    console.log('HEADER', row);
    header = row;
    next();
}));

decoder.blob.pipe(through.obj(function (row, enc, next) {
    console.log('BLOB', row);
}));

var mode = 'headersize';
var waiting = 0, prev;

fs.createReadStream('/home/substack/osm')
    .pipe(through(function write (buf, enc, next) {
        if (prev) {
            buf = Buffer.concat([ prev, buf ]);
            prev = null;
        }
        
        if (mode === 'headersize') {
            var n = buf.readUInt32BE(0);
            waiting = n;
            mode = 'header';
            write(buf.slice(4,4+n), enc, next);
        }
        else if (mode === 'header') {
            if (buf.length < waiting) {
                prev = buf;
                return next();
            }
            var hbuf = buf.slice(0, waiting);
            decoder.header.write(hbuf);
            prev = buf.slice(waiting);
            mode = 'blob';
            waiting = header.datasize;
            write(buf, enc, next);
        }
        else if (mode === 'blob') {
            if (buf.length < waiting) {
                prev = buf;
                return next();
            }
            decoder.blob.write(buf.slice(0,waiting));
        }
    }))
;
