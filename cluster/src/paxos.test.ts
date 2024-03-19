import { Paxos } from './paxos.js';
import { testMe, testNeighbors } from './testVariables.js';

test('does Paxos work', () => {
  const p = new Paxos(testMe, testNeighbors);
  expect(p.me).toBe(testMe);
});
