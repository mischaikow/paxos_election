import { ClusterState } from './helper.types.js';

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

export function stateSetup(nodeState: string | undefined): ClusterState {
  if (nodeState === 'child') {
    // call parent for neighbors.
    const portApi = Number(process.argv[2]);
    const portWs = portApi + 1000;
    console.log(portApi, portWs);
    console.log(process.argv[0]);
    console.log(process.argv[1]);
    console.log(process.argv[2]);
    return {
      containerName: portApi,
      neighbors: [portApi],
      portApi: portApi,
      portWs: portWs,
    };
  }
  const portApi = Number(process.env.PORT) ?? 3001;
  const portWs = portApi + 1000;
  return {
    containerName: Number(process.env.PORT),
    neighbors: [3001, 3002, 3003, 3004, 3005],
    portApi: Number(process.env.PORT) ?? 3001,
    portWs: portWs,
  };
}

export function launchChildEnv() {
  // This expects inputs to be in the order
  // . name
  return process.argv[2];
}

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
