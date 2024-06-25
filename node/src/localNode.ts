import { ChildData } from './app.types.js';
import config from 'config';
import { MSG_REQ_NEIGHBORS } from './constants.js';
import { setPort } from './app.js';
import { Paxos } from './paxos.js';
import { sleep } from './util.js';
import { WsServer } from './wsServer.js';

export class LocalNode {
  name: string;
  portApi: number;
  portWs: number;
  neighborhood: ChildData[];
  leader: ChildData | null;
  leaderSearching: boolean;
  paxosElection: Paxos;
  wsServer: WsServer | null;

  constructor() {
    if (process.env.NODE_STATE === 'child') {
      // Launched as a child process
      this.name = process.argv[2];
      this.portApi = Number(process.argv[3]);
      this.portWs = Number(process.argv[4]);
      this.neighborhood = [];
      if (process.send) {
        process.send(MSG_REQ_NEIGHBORS);
      } else {
        // TODO: throw error
      }
    } else if (process.env.NODE_ENV === 'cluster') {
      // Part of a cluster
      this.portApi = Number(process.env.PORT) || config.get('portApi');
      this.portWs = this.portApi + 1000;
      this.name = String(this.portApi - 2000);
      this.neighborhood = config.get('neighborhood');
    } else {
      // Default
      this.name = config.get('name');
      this.portApi = config.get('portApi');
      this.portWs = config.get('portWs');
      this.neighborhood = config.get('neighborhood');
    }

    this.leader = null;
    this.leaderSearching = false;
    this.paxosElection = new Paxos(this);
    this.wsServer = null;

    setPort(this.portApi);
    console.log(`[${this.name}] Node launched with API ${this.portApi} and WS ${this.portWs}`);
  }

  async newPaxos(): Promise<void> {
    this.leader = null;
    this.leaderSearching = true;
    this.paxosElection = new Paxos(this);
  }

  assignWsServer(wsServer: WsServer): void {
    this.wsServer = wsServer;
  }

  async findLeader(msWait: number) {
    console.log(`[${this.name}] New Leader search launched`);
    await sleep(msWait);
    await this.paxosElection.newElection();
    this.leaderSearching = false;
    this.wsServer?.statusBroadcast();
  }

  async shouldLaunchNewLeaderSearch(): Promise<boolean> {
    if (this.leaderSearching) {
      return false;
    }

    if (await this.isLeaderHealthy()) {
      return false;
    }

    return true;
  }

  async isLeaderHealthy(): Promise<boolean> {
    if (this.leader === null) {
      return false;
    }

    try {
      const response = await fetch(`http://localhost:${this.leader.portApi}/`);
      if (!response.ok) {
        throw 'Unresponsive neighbor';
      }
      return true;
    } catch (error) {
      console.log(`[${this.name}] Leader ${this.leader.nodeName} is unhealthy`);
      this.leader = null;
      this.wsServer?.leaderDownBroadcast();
      return false;
    }
  }

  assignLeader(leaderName: string): void {
    const tempLeader = this.neighborhood.find((neighbor) => {
      return neighbor.nodeName === leaderName;
    });

    if (tempLeader) {
      this.leader = tempLeader;
    } else {
      // TODO: throw error
    }
  }

  assignNeighbors(neighbors: ChildData[]): void {
    this.neighborhood = neighbors;
  }

  assignApi(newApi: number): void {
    this.portApi = newApi;
    setPort(this.portApi);
    console.log(`[${this.name}] Did I run one?`);
    if (process.send) {
      console.log(`[${this.name}] Did I run two?`);
      process.send(MSG_REQ_NEIGHBORS);
    }
  }
}
