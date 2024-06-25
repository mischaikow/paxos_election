import { ChildProcess } from 'child_process';

export interface ChildData {
  name: string;
  portApi: number;
  portWs: number;
}

export interface NodeChildData {
  nodeName: string;
  portApi: number;
  portWs: number;
}

export interface Child extends ChildData {
  connection: ChildProcess | null;
}
