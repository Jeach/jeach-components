#!/bin/bash
#-----------------------------------------------------------------------------
# Copyright (C) 2018 Christian Jean.
# All Rights Reserved.
#-----------------------------------------------------------------------------
# Script to build/release the client script (normal and minimized).
#-----------------------------------------------------------------------------
#

BASE="jeach-components"
REL="releases"

. $BASE-client/package.sh

echo "Releasing: $BASE-client-$VERSION.js"

cp $BASE-client/$BASE-client.js $REL/$BASE-client-$VERSION.js

[ ! -x "bin/jsmin" ] && sh/jsmin.sh
[ ! -x "bin/jsmin" ] && echo "Could not find 'JSMin' executable, aborting!" && exit 1

echo "Releasing: $BASE-client-$VERSION.min.js"
bin/jsmin < $BASE-client/$BASE-client.js > $REL/$BASE-client-$VERSION.min.js

