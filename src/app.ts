import express from 'express';
import { Leader } from './leader.js';
import { CONTAINER_NAME, NEIGHBORS, PORT_API, PORT_WS, randomIntFromInterval } from './helper.js';
import { WebSocketServers } from './webSocketServer.js';

const app = express();
export const leader = new Leader(CONTAINER_NAME, NEIGHBORS);

app.use(express.json());
app.set('port', PORT_API);

app.get('/', (req, res) => {
  return res.send(`${CONTAINER_NAME} is awake\n`);
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
  .listen(PORT_WS, () => console.log(`listening on ${PORT_WS}.`));

export const wsServers = new WebSocketServers(server, leader);

export default app;

export const dummy = (a: number): number => {
  return a + 1;
};
