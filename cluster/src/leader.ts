import { wsServers } from './app.js';
import { sleep } from './helper.js';
import { ChildData } from './helper.types.js';
import { myFetch } from './myFetch.js';
import { Paxos } from './paxos.js';

export class Leader {
  me: ChildData;
  leader: ChildData | null;
  neighbors: ChildData[];
  searching: boolean;
  paxosElection: Paxos;

  constructor(me: ChildData, neighbors: ChildData[]) {
    this.me = me;
    this.leader = null;
    this.neighbors = neighbors;
    this.searching = false;
    const neighborApis = neighbors.map((a) => a.portApi);
    this.paxosElection = new Paxos(this.me, neighborApis);
  }

  async shouldLaunchLeaderSearch(): Promise<boolean> {
    if (this.searching) {
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
      await myFetch(`http://localhost:${this.leader.portApi}/`, {
        retries: 3,
        retryDelay: 300,
        method: 'GET',
      });
      return true;
    } catch (error) {
      console.log(`leader is unhealthy ${this.leader.nodeName}`);
      wsServers.leaderDown();
      this.leader = null;
      return false;
    }
  }

  async newPaxos(): Promise<boolean> {
    this.searching = true;
    this.leader = null;
    const neighborApis = this.neighbors.map((a) => a.portApi);
    this.paxosElection = await new Paxos(this.me, neighborApis);
    return true;
  }

  async findLeader(msWait: number) {
    console.log(`Find Leader launched`);
    await sleep(msWait);
    await this.paxosElection.newElection(this);
    this.searching = false;
    console.log(`Leader elected - ${this.leader?.nodeName}`);
    wsServers.whoIsLeaderElected();
  }

  assignLeader(leaderApi: number) {
    for (const aNeighbor of this.neighbors) {
      if (aNeighbor.portApi === leaderApi) {
        this.leader = aNeighbor;
      }
    }
  }

  assignNeighbors(neighbors: ChildData[]) {
    this.neighbors = neighbors;
  }
}
