#!/bin/sh
#-----------------------------------------------------------------------------
# Copyright (C) 2018 by Christian Jean.
# All Rights Reserved.
#-----------------------------------------------------------------------------
# 

JS=$1

[ -z "$JS" ] && echo "No JavaScript file provided, aborting!" && exit 1
[ ! -e "$JS" ] && echo "JavaScript file '$JS' could not be found, aborting!" && exit 1

jsmin < $JS > $JS.min.js
