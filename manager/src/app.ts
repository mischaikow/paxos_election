import express from 'express';
import { buildPaxos } from './manager.js';
import { addChild } from './helper.js';

const app = express();
const children: string[] = [];

app.use(express.json());

app.set('port', 3000);

app.get('/', (req, res) => {
  return res.send('Paxos Manager Running\n');
});

app.get('/new_node', (req, res) => {
  const nextBuildName = addChild(children);
  buildPaxos(nextBuildName);
  return res.send('New node launched?\n');
});

app.get('/node_list', (req, res) => {
  return res.send(children);
});

export const dummy = (a: number): number => {
  return a + 1;
};

export default app;
