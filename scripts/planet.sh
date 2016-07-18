#!/bin/bash
time node generate.js --remove=1 -i ~/data/osm/planet-latest.osm.pbf \
  -o ~/data/osmtiles \
  -t $((1024*1024)) --ymin=-90 --ymax=90 --xmin=-180 --xmax=180 \
  --nproc=$((`nproc`-1)) --xcount=4 --ycount=4
