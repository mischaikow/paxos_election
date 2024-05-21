import { wsServers } from './app.js';
import { sleep } from './helper.js';
import { ChildData } from './helper.types.js';
import { myFetch } from './myFetch.js';
import { Paxos } from './paxos.js';

export class Leader {
  me: number;
  leader: number | null;
  neighbors: ChildData[];
  neighborApis: number[];
  searching: boolean;
  paxosElection: Paxos;

  constructor(me: number, neighbors: ChildData[]) {
    this.me = me;
    this.leader = null;
    this.neighbors = neighbors;
    this.neighborApis = neighbors.map((a) => a.portApi);
    this.searching = false;
    this.paxosElection = new Paxos(this.me, this.neighborApis);
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
      await myFetch(`http://localhost:${this.leader}/`, {
        retries: 3,
        retryDelay: 300,
        method: 'GET',
      });
      return true;
    } catch (error) {
      console.log(`leader is unhealthy ${this.leader}`);
      wsServers.leaderDown();
      this.leader = null;
      return false;
    }
  }

  async newPaxos(): Promise<boolean> {
    this.searching = true;
    this.leader = null;
    this.paxosElection = await new Paxos(this.me, this.neighborApis);
    return true;
  }

  async findLeader(msWait: number) {
    console.log(`Find Leader launched`);
    await sleep(msWait);
    await this.paxosElection.newElection(this);
    this.searching = false;
    console.log(`Leader elected - ${this.leader}`);
    wsServers.whoIsLeaderElected();
  }
}
