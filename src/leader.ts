import { sleep } from './helper.js';
import { Paxos } from './paxos.js';

export class Leader {
  me: string;
  leader: string | null;
  neighbors: string[];
  searching: boolean;
  paxosElection: Paxos;

  constructor(me: string, neighbors: string[]) {
    this.me = me;
    this.leader = null;
    this.neighbors = neighbors;
    this.searching = false;
    this.paxosElection = new Paxos(this.me, this.neighbors);
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
      false;
    }

    try {
      await fetch(`http://${this.leader}:3000/`, {
        method: 'GET',
      });
      return true;
    } catch (error) {
      this.leader = null;
      return false;
    }
  }

  async newPaxos(): Promise<boolean> {
    this.searching = true;
    this.paxosElection = await new Paxos(this.me, this.neighbors);
    return true;
  }

  async findLeader(msWait: number) {
    console.log(`Find Leader launched`);
    await sleep(msWait);
    await this.paxosElection.newElection(this);
    console.log(`Leader elected - ${this.leader}`);
    this.searching = false;
  }
}
