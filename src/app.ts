import express from 'express';
import { Leader } from './leader.js';
import { Paxos } from './paxos.js';
import { prepareHTTPWrapper } from './helper.js';

const CONTAINER_NAME = process.env.CONTAINER_NAME ?? 'Unknown';
const NEIGHBORS = ['service3001', 'service3002', 'service3003', 'service3004', 'service3005'];

const app = express();
export const leader = new Leader(NEIGHBORS);
export const paxos = new Paxos(CONTAINER_NAME, NEIGHBORS);

app.use(express.json());

app.set('port', 3000);

app.get('/', (req, res) => {
  return res.send(`${CONTAINER_NAME} is awake\n`);
});

app.get('/launch_post', (req, res) => {
  return res.send(prepareHTTPWrapper());
});

app.get('/launch_election', (req, res) => {
  paxos.newElection();
});

// Internal Paxos calls
await app.post('/prepare_ballot', (req, res) => {
  return res.json(paxos.promiseResponse(req.body));
});

app.post('/ballot_box', (req) => {
  paxos.ballotReceipt(req.body);
});

app.post('/vote_confirm', (req) => {
  paxos.voteReceipt(req.body);
});

export const dummy = (a: number): number => {
  return a + 1;
};
/*
setInterval(async () => {
  if (!(await leader.checkLeader())) {
    console.log('Leader down - initiating Paxos protocol');
    leader.leader = null;
    leader.leaderSearch = true;
    paxos.newElection();
  } else {
    console.log('Healthy leader');
  }
}, 5000);
*/
export default app;
