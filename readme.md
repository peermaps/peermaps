# peermaps

peer to peer cartography

This tool streams raw OpenStreetMap data from p2p networks so that you can
perform ad-hoc extracts for arbitrary bounding boxes. Because you are pulling
the data from a p2p network (and helping to host it), you also don't need to
worry about http quotas or rate limiting.

# example

Stream data inside arbitrary WSEN extents from the network:

```
$ peermaps data -155.064270 18.9136925 -154.8093872 19.9 | head
<?xml version='1.0' encoding='UTF-8'?>
<osm version="0.6" generator="osmconvert 0.8.4" timestamp="2016-11-28T01:59:58Z">
  <bounds minlat="18.9136925" minlon="-155.06427" maxlat="19.9" maxlon="-154.8093872"/>
  <node id="88994815" lat="19.7317131" lon="-155.0533157" version="3" timestamp="2012-01-19T21:23:51Z" changeset="10441415" uid="574654" user="Tom_Holland"/>
  <node id="88994817" lat="19.7312758" lon="-155.0533179" version="3" timestamp="2012-01-19T21:23:51Z" changeset="10441415" uid="574654" user="Tom_Holland"/>
  <node id="88994826" lat="19.7319167" lon="-155.0460457" version="3" timestamp="2012-01-19T21:23:51Z" changeset="10441415" uid="574654" user="Tom_Holland"/>
  <node id="88994829" lat="19.7329599" lon="-155.0463189" version="3" timestamp="2012-01-19T21:23:51Z" changeset="10441415" uid="574654" user="Tom_Holland"/>
  <node id="88994832" lat="19.7333033" lon="-155.0454221" version="3" timestamp="2012-01-19T21:23:51Z" changeset="10441415" uid="574654" user="Tom_Holland"/>
  <node id="88994836" lat="19.7336513" lon="-155.0450981" version="4" timestamp="2012-01-20T23:02:03Z" changeset="10451586" uid="574654" user="Tom_Holland"/>
  <node id="88994868" lat="19.7341231" lon="-155.0447835" version="3" timestamp="2012-01-20T23:02:03Z" changeset="10451586" uid="574654" user="Tom_Holland"/>
```

# install

requirements:

* [ipfs](https://dist.ipfs.io/)
* [nodejs + npm](https://nodejs.org)
* [osmconvert](https://wiki.openstreetmap.org/wiki/Osmconvert#Download)
* bash (for the `peermaps data` command)

Install the prerequisites, then install the `peermaps` command:

```
npm install -g peermaps
```

Run the ipfs daemon somewhere (in a `screen` for example):

```
ipfs daemon
```

Now you can use the `peermaps` command.

# usage

```
peermaps data W,S,E,N {OPTIONS}

  Print all data inside the W,S,E,N extents.

  -f      Output format: osm (default), o5m, pbf, csv.
  -n      Network: ipfs (default)
  --show  Print the generated command instead of running it.

peermaps files W,S,E,N

  Print the files from the archive that overlap with the W,S,E,N extents.

  -n      Network: ipfs (default)

peermaps read FILE

  Print the content of FILE from the archive.

  -n      Network: ipfs (default)

peermaps address

  Print the address of the peermaps archive for the given network.

  -n      Network: ipfs (default)

peermaps generate INFILE {OPTIONS}

  Generate a peermaps archive at OUTDIR for INFILE.

  -o OUTDIR   Default: ./mapdata
  -t MAXSIZE  Files must be no greater than MAXSIZE. Default: 1M
  --xmin      Minimum longitude (west). Default: -180
  --xmax      Maximum longitude (east). Default: 180
  --ymin      Minimum latitude (south). Default: -90
  --ymin      Maximum latitude (north). Default: 90
  --xcount    Number of longitude divisions per branch. Default: 4
  --ycount    Number of latitude divisions per branch. Default: 4
  --nproc     Number of converter processes to spawn. Default: (`nproc`-1)

  Example:
    peermaps generate planet-latest.osm.pbf -o ~/data/planet -t 5M

  Note: this operation may take days for planet-sized inputs.

```

# mirror

Help us mirror the archive! If you have a computer with ~38G and network to
spare, you can run:

```
ipfs pin add QmXJ8KkgKyjRxTrEDvmZWZMNGq1dk3t97AVhF1Xeov3kB4
```

For now there is only one archive hash. In the future, there will be more
archives and an update mechanism.

# todo

* generate and host vector tiles on p2p networks
* dat/hyperdrive support
* archive update mechanism
* torrent/webtorrent support?
* p2p web tile viewer
