export const CONTAINER_NAME = Number(process.env.PORT);
export const NEIGHBORS = [3001, 3002, 3003, 3004, 3005];
export const PORT_API = Number(process.env.PORT) ?? 3000;
export const PORT_WS = PORT_API + 1000;
export const DOWNTIME = 7000;

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
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function randomIntFromInterval(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function assert(bool: boolean, message: string) {
  if (!bool) {
    throw new Error(message);
  }
}
