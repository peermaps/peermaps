var fs = require('fs');
var protobuf = require('protocol-buffers');
var through = require('through2');
var zlib = require('zlib');

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


var osmheader = protobuf([
    {
        name: 'bbox',
        type: 'object',
        fields: [
            {
                type: 'sint64',
                name: 'left',
                tag: 1
            },
            {
                type: 'sint64',
                name: 'right',
                tag: 2
            },
            {
                type: 'sint64',
                name: 'top',
                tag: 3
            },
            {
                type: 'sint64',
                name: 'bottom',
                tag: 4
            }
        ],
        tag: 1
    },
    {
        name: 'required_features',
        type: 'string',
        tag: 4
    },
    {
        name: 'optional_features',
        type: 'string',
        tag: 5
    },
    {
        name: 'writingprogram',
        type: 'string',
        tag: 16
    },
    {
        name: 'source',
        type: 'string',
        tag: 17
    },
    {
        name: 'osmosis_replication_timestamp',
        type: 'int64',
        tag: 32
    },
    {
        name: 'osmosis_replication_base_url',
        type: 'string',
        tag: 34
    }
]);

var decoder = {
    header: blobHeader.createDecodeStream(),
    blob: blob.createDecodeStream(),
    osm: osmheader.createDecodeStream()
};

var header;
decoder.header.pipe(through.obj(function (row, enc, next) {
    console.log('HEADER', row);
    header = row;
    next();
}));

decoder.osm.pipe(through.obj(function (row, enc, next) {
    console.log('OSM', row);
    next();
}));

var blob;
decoder.blob.pipe(through.obj(function (row, enc, next) {
    console.log('BLOB', row);
console.log(row.zlib_data);
    zlib.inflateRaw(row.zlib_data, function (err, data) {
console.log(err, data); 
        decoder.osm.write(data);
    });
    next();
}));

var mode = 'headersize';
var waiting = 4, prev;

fs.createReadStream('/home/substack/osm')
    .pipe(through(function write (buf, enc, next) {
        if (prev) {
            buf = Buffer.concat([ prev, buf ]);
            prev = null;
        }
console.log(mode, waiting); 
        
        if (mode === 'headersize') {
            if (buf.length < waiting) {
                prev = buf;
                return next();
            }
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
            mode = 'headersize';
            var nbuf = buf.slice(waiting);
            waiting = 4;
            //waiting = header.datasize;
            write(nbuf, enc, next);
        }
        else if (mode === 'blob') {
            if (buf.length < waiting) {
                prev = buf;
                return next();
            }
            decoder.blob.write(buf.slice(0,waiting));
            waiting = 0;
            //mode = 'headersize';
            //write(buf.slice(waiting), enc, next);
        }
    }))
;
