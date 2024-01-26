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

export function sleep(ms: number): Promise<void> {
  console.log(`wait time is ${ms / 1000}`);
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function randomIntFromInterval(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// HTTP wrapper functions
// This just lets me test paxos.prepare - remember to change the input!
export async function prepareHTTPWrapper() {
  const dummy = await paxos.prepareBallot(1);
  console.log(dummy);
}
