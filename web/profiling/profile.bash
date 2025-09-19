#!/usr/bin/env bash

HERE=$(dirname $(readlink -m "$0"))
cd "$HERE"

PROFDIR='profiles.removeme'
mkdir -p $PROFDIR
rm -f $PROFDIR/*

npx tsx --cpu-prof --cpu-prof-dir=$PROFDIR mesh.ts
PROFILE=$PROFDIR/$(ls $PROFDIR | head -n1)
python functime.py --func createSurfaceMesh $PROFILE
