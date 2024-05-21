import { ChildData, NodeState } from './helper.types.js';

export const DOWNTIME = 7000;
export const MSG_REQ_NEIGHBORS = 'child-request-neighbors';

export const STANDING: {
  nack: 'nack';
  promise: 'promise';
  failure: 'failure';
} = {
  nack: 'nack',
  promise: 'promise',
  failure: 'failure',
};

export function stateSetup(nodeState: string | undefined): NodeState {
  if (nodeState === 'child') {
    console.log(process.argv);
    const nodeName = Number(process.argv[2]);
    const portApi = Number(process.argv[3]);
    const portWs = Number(process.argv[4]);
    // TODO ask the parent for a list of neighbors
    if (process.send) {
      process.send(MSG_REQ_NEIGHBORS);
    } else {
      // throw error
    }
    const neighbors: ChildData[] = [];
    console.log(`New child ${nodeName} with API ${portApi} and WSS ${portWs}`);
    return {
      nodeName: nodeName,
      neighbors: neighbors,
      portApi: portApi,
      portWs: portWs,
    };
  }

  // Not a child process.
  const portApi = Number(process.env.PORT) ?? 3001;
  const portWs = portApi + 1000;
  return {
    nodeName: portApi,
    neighbors: [
      { nodeName: 1001, portApi: 3001, portWs: 4001 },
      { nodeName: 1002, portApi: 3002, portWs: 4002 },
      { nodeName: 1003, portApi: 3003, portWs: 4003 },
      { nodeName: 1004, portApi: 3004, portWs: 4004 },
      { nodeName: 1005, portApi: 3005, portWs: 4005 },
    ],
    portApi: portApi,
    portWs: portWs,
  };
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
