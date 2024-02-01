export const CONTAINER_NAME = process.env.CONTAINER_NAME ?? 'Unknown';
export const NEIGHBORS = ['service3001', 'service3002', 'service3003', 'service3004', 'service3005'];

export const STANDING: {
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
