import express from 'express';
import cron from 'node-cron';
import { Leader } from './leader.js';
import { Paxos } from './paxos.js';
import { prepareHTTPWrapper } from './helper.js';

const CONTAINER_NAME = process.env.CONTAINER_NAME ?? 'Unknown';
const NEIGHBORS = ['service3001', 'service3002', 'service3003', 'service3004', 'service3005'];

const app = express();
const leader = new Leader(NEIGHBORS);
export const paxos = new Paxos(CONTAINER_NAME, NEIGHBORS);

app.use(express.json());

app.set('port', 3000);

app.get('/', (req, res) => {
  return res.send(`${CONTAINER_NAME} is awake\n`);
});

app.get('/launch_post', (req, res) => {
  return res.send(prepareHTTPWrapper());
});

// Internal Paxos call
app.post('/prepare', (req, res) => {
  return res.send(paxos.promiseMessage(req.body));
});

export const dummy = (a: number): number => {
  return a + 1;
};

// The CRON job that makes this tick - runs every 5 seconds
cron.schedule('*/12 * * * *', () => {
  console.log('Checking leader status');
  if (!leader.checkLeader()) {
    console.log('Leader down - initiating Paxos protocol');
    paxos.paxosProtocol();
  }
});

export default app;
