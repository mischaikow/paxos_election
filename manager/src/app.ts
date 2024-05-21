import express from 'express';
import { buildPaxos } from './manager.js';
import { AllChildState, ChildState } from './manager.types.js';
import { Children } from './children.js';

const app = express();
const children = new Children();

app.use(express.json());

app.set('port', 3000);

app.get('/', (req, res) => {
  return res.send('Paxos Manager Running\n');
});

app.get('/new_node', async (req, res) => {
  const newChild = children.addChild();
  await buildPaxos(children, newChild);
  return res.send(`New node launched: ${newChild.nodeName}\n`);
});

app.get('/node_list', (req, res) => {
  return res.send(children.listChildren());
});

export const dummy = (a: number): number => {
  return a + 1;
};

export default app;
