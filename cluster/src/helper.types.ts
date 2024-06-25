export interface ChildData {
  nodeName: number;
  portApi: number;
  portWs: number;
}

export interface NodeState {
  nodeName: number;
  neighbors: ChildData[];
  portApi: number;
  portWs: number;
}

export interface RequestNeighborsMessage {
  signal: 'child-request-neighbors';
  data: ChildData[];
}

export interface RequestNewAPIMessage {
  signal: 'child-request-new-api';
  data: { newPort: number }[];
}

export type ParentChildMessage = RequestNeighborsMessage | RequestNewAPIMessage;
