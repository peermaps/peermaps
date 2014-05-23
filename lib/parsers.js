var protobuf = require('protocol-buffers');

exports.header = protobuf([
    {
        type: 'string',
        name: 'type',
        tag: 1
    },
    {
        type: 'bytes',
        name: 'indexdata',
        tag: 2
    },
    {
        type: 'int32',
        name:  'datasize',
        tag: 3
    }
]);

exports.blob = protobuf([
    {
        type: 'bytes',
        name: 'raw',
        tag: 1
    },
    {
        type: 'int32',
        name: 'raw_size',
        tag: 2
    },
    {
        type: 'bytes',
        name: 'zlib_data',
        tag: 3
    }
]);

exports.osmheader = protobuf([
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

exports.osmdata = protobuf([
    {
        name: 'stringtable',
        type: 'bytes',
        tag: 1
    },
    {
        name: 'primitivegroup',
        type: 'bytes',
        tag: 2
    },
    {
        name: 'granularity',
        type: 'int32',
        tag: 17
    },
    {
        name: 'lat_offset',
        type: 'int64',
        tag: 19
    },
    {
        name: 'lon_offset',
        type: 'int64',
        tag: 20
    },
    {
        name: 'date_granularity',
        type: 'int32',
        tag: 18
    }
]);

exports.primitiveGroup = protobuf([
    {
        name: 'node',
        type: 'bytes',
        tag: 1
    },
    {
        name: 'dense_nodes',
        type: 'bytes',
        tag: 2
    },
    {
        name: 'way',
        type: 'bytes',
        tag: 3
    },
    {
        name: 'relations',
        type: 'bytes',
        tag: 4
    },
    {
        name: 'changesets',
        type: 'bytes',
        tag: 5
    },
]);

exports.way = protobuf([
    {
        name: 'id',
        type: 'int64',
        tag: 1
    },
    {
        name: 'keys',
        type: 'int32',
        tag: 2
    },
    {
        name: 'values',
        type: 'int32',
        tag: 3
    },
    {
        name: 'info',
        type: 'bytes',
        tag: 4
    },
    {
        name: 'refs',
        type: 'int64',
        tag: 8
    }
]);

exports.dense = protobuf([
    {
        name: 'id',
        type: 'bytes',
        tag: 1
    },
    {
        name: 'denseinfo',
        type: 'bytes',
        tag: 5
    },
    {
        name: 'lat',
        type: 'bytes',
        tag: 8
    },
    {
        name: 'lon',
        type: 'bytes',
        tag: 9
    },
    {
        name: 'keys_vals',
        type: 'bytes',
        tag: 10
    }
]);
