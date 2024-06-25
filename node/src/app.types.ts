export interface ChildData {
  nodeName: string;
  portApi: number;
  portWs: number;
}

export interface RequestNeighborsMessage {
  signal: 'child-request-neighbors';
  data: ChildData[];
}

export interface RequestNewAPIMessage {
  signal: 'child-request-new-api';
  data: { newPortApi: number };
}

export interface RequestProcessExit {
  signal: 'child-request-exit';
}

export type ParentChildMessage = RequestNeighborsMessage | RequestNewAPIMessage | RequestProcessExit;
