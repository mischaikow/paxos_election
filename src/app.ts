import express from 'express';
import { Leader } from './leader.js';
import { CONTAINER_NAME, NEIGHBORS } from './helper.js';

const app = express();
export const leader = new Leader(CONTAINER_NAME, NEIGHBORS);

app.use(express.json());
app.set('port', 3000);

app.get('/', (req, res) => {
  return res.send(`${CONTAINER_NAME} is awake\n`);
});

setInterval(async () => {
  if (await leader.shouldLaunchLeaderSearch()) {
    await leader.newPaxos();
    leader.findLeader(0);
  }
}, 5000);

app.get('/launch_election', (req, res) => {
  leader.leader = null;
  leader.findLeader(0);
  return res.send('Leader Search Initiated\n');
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

export default app;

export const dummy = (a: number): number => {
  return a + 1;
};
