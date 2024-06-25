# Paxos

A TypeScript and Node.js implementation of the Paxos algorithm to model leadership election.
Each node in the system is independently controlled by its own Node.js implementation, meaning the behavior of the system is emergent from the protocols being implemented by each node.

The implimentation was enhanced to handle cases outside of the original algorithm, such as multiple nodes simultaneously starting elections and nodes dropping in and out of existence.

**This project has reached MVP and I expect to make no changes for a while.**

## Details

This implementation contains two parts:
the backend algorithm that comprises two parts, an omniscient controller which simulates the environment around the nodes and the nodes themselves.
Additionally, a frontend has been built to provide visualization of the models.

## How to run

### Backend

To just run the backend, first set up the dependencies in both the `node/` and `controller/` directories by running

```bash
pnpm i
```

in both directories.

Then the controller can be launched at port 3000 by navigating to `node/` and running

```bash
pnpm run dev
```

Instances can be launched by sending a `GET` request to the endpoint `http://localhost:3000/new_node` either through the browser or via an API platform like Postman or VSCode's REST Client.
This will return the node name, API port it uses, and WS port it uses.

In turn, instances can be degraded by sending a `POST` request to the endpoint `http://localhost:3000/degrade_node/nodeName/{nodeName}`

### Frontend

There is also a Svelte frontend that can be used to visualize the instances running. Dependencies are installed by navigating to `frontend` and running

```bash
pnpm i
```

Once the dependencies are installed, the Svelte app can be run with

```bash
pnpm run dev
```

And the page will launch at `http://localhost:5173/`. This must be visited before any backend nodes have been launched, or they will not appear on the site.

An additional feature is if you click on any active node, it will be temporarily knocked "offline".

### The Simplest election

It is also possible to just spin up 5 nodes and watch them elect a leader. Once dependencies in `node/` have been installed with `pnpm i`, the command

```bash
pnpm run cluster
```

will launch 5 nodes that will select a leader amongst themselves.

## Potential To-dos

- Have the nodes/controller dynamically find free ports on the local machine rather than using preassigned ports.
- Improve terminal printouts from the nodes to make it easier to see what's happening.
- Improve error logging to better distinguish between "simulation errors" and actual problems.
- Build a test suite to cover the controller and nodes.
- Allow the frontend to load and accurately capture the state of the model as is.
- Enhance the frontend to allow permanent degredation of nodes from the webpage.
