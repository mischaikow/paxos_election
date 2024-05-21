import express from 'express';
import { Leader } from './leader.js';
import { stateSetup, randomIntFromInterval, MSG_REQ_NEIGHBORS } from './helper.js';
import { WebSocketServers } from './webSocketServer.js';
import { ParentChildMessage } from './helper.types.js';

const app = express();

// TODO: Separate name from port number.
export const nodeState = stateSetup(process.env.NODE_STATE);

export const leader = new Leader(nodeState.nodeName, nodeState.neighbors);

app.use(express.json());
app.set('port', nodeState.portApi);

app.get('/', (req, res) => {
  return res.send(`${nodeState.nodeName} is awake and ${typeof process.send} is valid!\n`);
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
  console.log(req.body);
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
  .listen(nodeState.portWs, () => console.log(`listening on ${nodeState.portWs}.`));

// The parent-child communciation channel:
process.on('message', (msg: ParentChildMessage) => {
  console.log(msg.signal);
  if (msg.signal === MSG_REQ_NEIGHBORS) {
    console.log('I understood this!');
  }
});

process.stdin.on('data', (data) => {
  console.log(`Parent data ${JSON.stringify(data)}`);
});

export const wsServers = new WebSocketServers(server, leader);

export default app;

export const dummy = (a: number): number => {
  return a + 1;
};
