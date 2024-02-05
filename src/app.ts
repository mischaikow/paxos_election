import express from 'express';
import { WebSocketServer } from 'ws';
import { Leader } from './leader.js';
import { CONTAINER_NAME, NEIGHBORS, PORT_API, PORT_WS } from './helper.js';

const app = express();
export const leader = new Leader(CONTAINER_NAME, NEIGHBORS);

app.use(express.json());
app.set('port', PORT_API);

app.get('/', (req, res) => {
  return res.send(`${CONTAINER_NAME} is awake\n`);
});
/*
setInterval(async () => {
  if (await leader.shouldLaunchLeaderSearch()) {
    await leader.newPaxos();
    leader.findLeader(0);
  }
}, 5000);
*/
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

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Dashboard connected');

  ws.on('close', () => console.log('Dashboard disconnected'));

  ws.on('message', (message) => {
    console.log(`${message}`);
    if (message.toString() === 'status') {
      console.log(`Received status check, measure ${leader.leader}`);
      if (leader.leader === null) {
        ws.send(`undefined`);
      } else if (leader.leader === leader.me) {
        ws.send(`me`);
      } else {
        ws.send(`defined`);
      }
    } else {
      ws.send('uhhh...');
    }
  });
});

export default app;

export const dummy = (a: number): number => {
  return a + 1;
};

/// const ws = new WebSocket("ws://localhost:4000")
/// ws.onmessage = (evt) => {
///   const received_msg = evt.data;
///   console.log(`leader is ${evt.data}`);
/// }
/// ws.send('status');
