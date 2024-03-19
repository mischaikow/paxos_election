# Paxos

A TypeScript implimentation of the Paxos algorithm.
Each node in the system is independently controlled by its own Node.js implementation, meaning the behavior of the system is emergent from the protocols being implemented by each node.

The implimentation was enhanced to handle cases outside of the original algorithm, such as multiple nodes simultaneously starting elections and nodes dropping in and out of existence.

## How to run

Once the repo has been downloaded to its own directory, get node set up with

`pnpm i`

Then launch the nodes with the command

`pnpm run dev-local`

This should launch the 5 servers and they should communicate with each other until a node is elected leader.

## TODO

The Paxos algorithm works.
However the code base still has a lot of loose strings, abandonded threads, and potential implementations.

- **Add port & node manager** The path of least resistance is leading me to building a co-ordinator that tracks available ports. This solves several problems:
  - **Fix the websocket code** The primary fail point for the websockets aren't actually the websockets. When a node is taken offline, the express server is failing to reconnect since `server.close()` will stay open if the websocket has any open connections.
  - **Abstract and generlize the node count** To get this project across the finish line, I hard-coded the number and names of the nodes. I would like to abstract this so that users can decide how many nodes there are.
- **Set up some illustrative tests** This should allow users to more easily understand what individual functions are doing, and make it easier to safely make changes to the codebase.
- **Add presentation slides (with notes!)** I gave a one-hour presentation at the [Recurse Center](https://www.recurse.com), and the slides can help understand what this code does.
- **Drop fetchRetry** This was added because of issues with inter-container communication when running on a local Docker daemon. It's no longer necessary and should be discarded.
