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
