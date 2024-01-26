import { paxos } from './app.js';

export const STATUS: {
  nack: 'nack';
  promise: 'promise';
  failure: 'failure';
} = {
  nack: 'nack',
  promise: 'promise',
  failure: 'failure',
};

export async function sleep(ms: number) {
  await sleep(ms);
}

// HTTP wrapper functions
// This just lets me test paxos.prepare - remember to change the input!
export async function prepareHTTPWrapper() {
  const dummy = await paxos.prepare(1);
  console.log(dummy);
}
