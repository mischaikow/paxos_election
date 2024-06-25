import express from 'express';
import { LocalNode } from './localNode.js';
import { randomIntFromInterval } from './util.js';
import { ParentChildMessage } from './app.types.js';
import { MSG_PROCESS_EXIT, MSG_REQ_NEIGHBORS, MSG_REQ_NEW_API } from './constants.js';
import { WsServer } from './wsServer.js';

const app = express();
app.use(express.json());

export const localNode = new LocalNode();

export function setPort(portApi: number) {
  app.set('port', portApi);
}

const server = app.listen(localNode.portWs, () => console.log(`[${localNode.name}] Listening on ${localNode.portWs}`));

localNode.assignWsServer(new WsServer(server, localNode));

setInterval(
  async () => {
    if (await localNode.shouldLaunchNewLeaderSearch()) {
      await localNode.newPaxos();
      localNode.findLeader(0);
    }
  },
  randomIntFromInterval(3500, 6500),
);

app.get('/', (req, res) => {
  return res.send(`${localNode.name} is operating with portApi ${localNode.portApi} and ${localNode.portWs}\n`);
});

//// Paxos calls
app.post('/prepare_ballot', async (req, res) => {
  if (await localNode.shouldLaunchNewLeaderSearch()) {
    await localNode.newPaxos();
    localNode.findLeader(250);
  }
  return res.json(localNode.paxosElection.promiseResponse(req.body));
});

app.post('/ballot_box', async (req) => {
  if (await localNode.shouldLaunchNewLeaderSearch()) {
    await localNode.newPaxos();
    localNode.findLeader(250);
  }
  localNode.paxosElection.ballotReceipt(req.body);
});

app.post('/vote_confirm', async (req) => {
  if (await localNode.shouldLaunchNewLeaderSearch()) {
    await localNode.newPaxos();
    localNode.findLeader(250);
  }
  localNode.paxosElection.voteReceipt(req.body);
});

//// Parent-child communication
process.on('message', (msg: ParentChildMessage) => {
  switch (msg.signal) {
    case MSG_REQ_NEIGHBORS: {
      localNode.assignNeighbors(msg.data);
      break;
    }
    case MSG_REQ_NEW_API: {
      localNode.assignApi(msg.data.newPortApi);
      break;
    }
    case MSG_PROCESS_EXIT: {
      console.log(`[${localNode.name}] Received process.exit request - processing now`);
      process.exit();
      break;
    }
    default: {
      console.log(`[${localNode.name}] Received unknown message from parent:\n${JSON.stringify(msg)}`);
      break;
    }
  }
});

export function getNewPortApi() {
  if (process.send) {
    process.send(MSG_REQ_NEW_API);
  }
}

export default app;
