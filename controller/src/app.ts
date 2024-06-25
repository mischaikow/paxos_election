import express from 'express';
import cors from 'cors';
import config from 'config';
import { Children } from './children.js';

const app = express();
const children = new Children();

app.use(express.json());
app.use(cors());
app.set('port', config.get('portApi'));

app.get('/', (req, res) => {
  return res.send('Paxos manager running\n');
});

app.get('/new_node', (req, res) => {
  const newChild = children.addChild();
  return res.send(newChild);
});

app.post('/degrade_node/nodeName/:nodeName', (req, res) => {
  const oldChild = children.removeChild(req.params.nodeName);
  return res.send(`Node degraded ${oldChild}`);
});

export default app;
