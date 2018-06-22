#!/bin/sh
#-----------------------------------------------------------------------------
# https://gist.github.com/danbettles/2823177
#-----------------------------------------------------------------------------
# 

TEMP_DIR="/tmp/jsmin"
SRC_FILENAME="http://www.crockford.com/javascript/jsmin.c"
SRC_BASENAME="jsmin.c"
BIN_BASENAME="jsmin"
BIN_DIR=$(pwd)

mkdir $TEMP_DIR
cd $TEMP_DIR
curl --output $SRC_BASENAME $SRC_FILENAME
gcc $SRC_BASENAME -o $BIN_BASENAME
cp $BIN_BASENAME $BIN_DIR && echo "$BIN_BASENAME copied to $BIN_DIR"
cd -
rm -rf $TEMP_DIR
