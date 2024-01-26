import axios from 'axios';
import { STATUS, sleep } from './helper.js';
import { Leader } from './leader.js';
import { LivePromResponse, PrepMessage, PromResponse } from './paxos.types.js';

export class Paxos {
  me: string;
  paxosLedger: string[];
  lastPrepare: number;
  neighbors: string[];

  constructor(me: string, neighbors: string[]) {
    this.me = me;
    this.paxosLedger = [''];
    this.lastPrepare = 0;
    this.neighbors = neighbors;
  }

  async newElection(leader: Leader) {
    const hasLeader = false;
    while (!hasLeader) {
      if (await this.paxosProtocol()) {
        break;
      } else {
        await sleep(100);
      }

      if (leader.leader !== null) {
        break;
      }
    }

    console.log(`New leader elected - $${leader.leader}`);
  }

  async paxosProtocol(): Promise<boolean> {
    // Run part 1, and if successful, run part 2
    this.lastPrepare++;
    const ballot = await this.prepare(this.lastPrepare);
    if (ballot !== undefined) {
      // return await this.election(this.lastPrepare);
      // run part 2
    }

    return false;
  }

  async prepare(proposalNumber: number): Promise<string | undefined> {
    const responses: PromResponse[] = await Promise.all(
      this.neighbors.map((neighbor) => {
        return this.sendOnePrepareMessage(neighbor, proposalNumber);
      }),
    );

    let voterCounter = 0;
    let lastVote = -1;
    let latestAnswer;
    for (const response of responses) {
      if (response.status === STATUS.nack) {
        this.paxosLedger[response.previousProposalNumber!] = response.previousAcceptedValue!;
      } else if (response.status === STATUS.promise) {
        voterCounter++;
        if (response.previousProposalNumber > lastVote) {
          lastVote = response.previousProposalNumber;
          latestAnswer = response.previousAcceptedValue;
        }
      }
    }

    if (voterCounter > this.neighbors.length / 2) {
      return latestAnswer ?? this.me;
    }

    return undefined;
  }

  async sendOnePrepareMessage(neighbor: string, proposalNumber: number): Promise<PromResponse> {
    return await axios({
      method: 'post',
      url: `http://${neighbor}:3000/prepare`,
      timeout: 500,
      data: {
        proposalNumber: proposalNumber,
      },
    })
      .then((res) => {
        console.log(res.data);
        return res.data;
      })
      .catch(() => {
        return {
          status: STATUS.failure,
          neighbor: neighbor,
        };
      });
  }

  promiseMessage(ask: PrepMessage): LivePromResponse {
    return {
      status: ask.proposalNumber < this.lastPrepare ? STATUS.nack : STATUS.promise,
      neighbor: this.me,
      previousProposalNumber: this.paxosLedger.length - 1,
      previousAcceptedValue: this.paxosLedger.at(-1),
    };
  }
}
