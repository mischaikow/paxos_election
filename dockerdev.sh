#!/bin/sh

if [ -z ${PORT+x} ]
then
  PORT=3000
fi

docker build -t dev-watch -f Dockerfile.dev .
docker run -p 3000:$PORT -v ./:/usr/src/app -v /usr/src/app/node_modules --rm dev-watch