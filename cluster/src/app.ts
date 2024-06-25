import express from 'express';
import { Leader } from './leader.js';
import { stateSetup, randomIntFromInterval, MSG_REQ_NEIGHBORS, MSG_REQ_NEW_API } from './helper.js';
import { WebSocketServers } from './webSocketServer.js';
import { ParentChildMessage } from './helper.types.js';

const app = express();

export function setPort(portApi: number) {
  app.set('port', portApi);
}

export const leader = new Leader(stateSetup(process.env.NODE_STATE));

app.use(express.json());

app.get('/', (req, res) => {
  const answer = `${leader.me.nodeName} is awake and ${leader.leader
    ?.nodeName} is currently my leader.\n\n${JSON.stringify(leader.neighbors)}\n\nI am communication through API ${
    leader.me.portApi
  } and WS ${leader.me.portWs}`;
  return res.send(answer);
});

setInterval(
  async () => {
    if (await leader.shouldLaunchLeaderSearch()) {
      await leader.newPaxos();
      leader.findLeader(0);
    }
  },
  randomIntFromInterval(3500, 6500),
);

app.get('/launch_election', (req, res) => {
  leader.leader = null;
  leader.findLeader(0);
  return res.send('Leader Search Initiated\n');
});

app.get('/ledger', (req, res) => {
  leader.paxosElection.printLedger();
  return res.send('hit');
});

// Internal Paxos calls
app.post('/prepare_ballot', async (req, res) => {
  if (await leader.shouldLaunchLeaderSearch()) {
    await leader.newPaxos();
    leader.findLeader(250);
  }
  return res.json(leader.paxosElection.promiseResponse(req.body));
});

app.post('/ballot_box', async (req) => {
  if (await leader.shouldLaunchLeaderSearch()) {
    await leader.newPaxos();
    leader.findLeader(250);
  }
  leader.paxosElection.ballotReceipt(req.body);
});

app.post('/vote_confirm', async (req) => {
  if (await leader.shouldLaunchLeaderSearch()) {
    await leader.newPaxos();
    leader.findLeader(250);
  }
  leader.paxosElection.voteReceipt(req.body);
});

const server = app
  .use((req, res) => res.sendFile('/', { root: __dirname }))
  .listen(leader.me.portWs, () => console.log(`listening on ${leader.me.portWs}.`));

// The parent-child communciation channel:
process.on('message', (msg: ParentChildMessage) => {
  if (msg.signal === MSG_REQ_NEIGHBORS) {
    leader.assignNeighbors(msg.data);
  } else if (msg.signal === MSG_REQ_NEW_API) {
    leader.changePortApi(msg.data[0].newPort);
  }
});

process.stdin.on('data', (data) => {
  console.log(`Parent data ${JSON.stringify(data)}`);
});

export function getNewAPIPortNumber() {
  if (process.send) {
    process.send(MSG_REQ_NEW_API);
  }
}

export const wsServers = new WebSocketServers(server, leader);

export default app;

export const dummy = (a: number): number => {
  return a + 1;
};
