#!/usr/bin/env bash

HERE=$(dirname $(readlink -m "$0"))
cd "$HERE"

function setup() {
    TEMPDIR='REMOVEME'
    rm -rf $TEMPDIR
    mkdir -p $TEMPDIR
}

function profile() {
    node --cpu-prof --cpu-prof-interval=100 --cpu-prof-dir=$TEMPDIR $TEMPDIR/mesh.js
    PROFILE=$TEMPDIR/$(ls $TEMPDIR | grep -E '.cpuprofile' | head -n1)
    python functime.py --func createSurfaceMesh $PROFILE
}

function compile() {
    npx esbuild mesh.ts --bundle --platform=node --target=node18 --outfile=$TEMPDIR/mesh.js --sourcemap
}

function bench() {
    taskset -c 2 node $TEMPDIR/mesh.js
}

setup
compile
bench | tee $TEMPDIR/bench.md

