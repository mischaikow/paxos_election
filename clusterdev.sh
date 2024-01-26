#!/bin/sh

docker build -t dev-watch -f Dockerfile.dev .
docker network create local-cluster

docker run --name=service3001 -e CONTAINER_NAME=service3001 --net=local-cluster -d -p 3001:3000 -v ./:/usr/src/app -v /usr/src/app/node_modules/ --rm dev-watch
docker run --name=service3002 -e CONTAINER_NAME=service3002 --net=local-cluster -d -p 3002:3000 -v ./:/usr/src/app -v /usr/src/app/node_modules/ --rm dev-watch
docker run --name=service3003 -e CONTAINER_NAME=service3003 --net=local-cluster -d -p 3003:3000 -v ./:/usr/src/app -v /usr/src/app/node_modules/ --rm dev-watch
docker run --name=service3004 -e CONTAINER_NAME=service3004 --net=local-cluster -d -p 3004:3000 -v ./:/usr/src/app -v /usr/src/app/node_modules/ --rm dev-watch
docker run --name=service3005 -e CONTAINER_NAME=service3005 --net=local-cluster -d -p 3005:3000 -v ./:/usr/src/app -v /usr/src/app/node_modules/ --rm dev-watch