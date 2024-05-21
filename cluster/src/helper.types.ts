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

export interface ParentChildMessage {
  signal: string;
  data: object[];
}
