#!/bin/sh

docker build -t dev-watch -f Dockerfile.dev .
docker run -p 3000:3000 -v ./:/usr/src/app -v /usr/src/app/node_modules --rm dev-watch