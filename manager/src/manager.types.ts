import { ChildProcess } from 'child_process';

export interface ChildState {
  nodeName: number;
  portApi: number;
  portWs: number;
  connection: ChildProcess | null;
}

export interface ChildData {
  nodeName: number;
  portApi: number;
  portWs: number;
}

export interface ParentChildMessage {
  signal: string;
  data: ChildData[];
}

export type AllChildState = Record<string, ChildState>;
