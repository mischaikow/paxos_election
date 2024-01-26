import axios from 'axios';
import { leader } from './app.js';
import { STATUS, randomIntFromInterval, sleep } from './helper.js';
import { BallotMessage, LedgerEntry, LivePromResponse, PrepMessage, PromResponse } from './paxos.types.js';

export class Paxos {
  me: string;
  neighbors: string[];
  lastProposalNumber: number;
  paxosLedger: LedgerEntry[];

  constructor(me: string, neighbors: string[]) {
    this.me = me;
    this.neighbors = neighbors;
    this.lastProposalNumber = -1;
    this.paxosLedger = [];
  }

  async newElection() {
    while (!leader.leader) {
      await this.paxosProtocol();
      //await sleep(randomIntFromInterval(250000, 350000));
    }
  }

  async paxosProtocol() {
    const ballot = await this.prepareBallot(this.lastProposalNumber + 1);
    if (ballot !== undefined) {
      await this.sendBallot(ballot);
    }
  }

  async prepareBallot(proposalNumber: number): Promise<BallotMessage | undefined> {
    const responses = await Promise.allSettled(
      this.neighbors.map((neighbor) => {
        return this.sendOnePrepareBallot(neighbor, proposalNumber);
      }),
    );

    let responseCounter = 0;
    let lastProposalNumber = -1;
    let latestAnswer;
    for (const response of responses) {
      if (response.value!.status! === STATUS.promise) {
        responseCounter++;
        if (response.value!.previousProposalNumber! > lastProposalNumber) {
          lastProposalNumber = response.value!.previousProposalNumber;
          latestAnswer = response.value!.previousAcceptedValue;
        }
      }
    }

    if (responseCounter > this.neighbors.length / 2) {
      return {
        proposalNumber: proposalNumber,
        leaderProposal: latestAnswer ?? this.me,
      };
    }
  }

  async sendOnePrepareBallot(neighbor: string, proposalNumber: number): Promise<PromResponse> {
    return await axios({
      method: 'post',
      url: `http://${neighbor}:3000/prepare_ballot`,
      timeout: 500,
      data: {
        proposalNumber: proposalNumber,
      },
    })
      .then((res) => {
        return res.data;
      })
      .catch(() => {
        return STATUS.failure;
      });
  }

  sendBallot(ballot: BallotMessage) {
    this.neighbors.map((neighbor) => {
      axios({
        method: 'post',
        url: `http://${neighbor}:3000/ballot_box`,
        data: ballot,
      });
    });
  }

  sendVoteConfirms(ballot: LedgerEntry) {
    this.neighbors.map((neighbor) => {
      axios({
        method: 'post',
        url: `http://${neighbor}:3000/vote_confirm`,
        data: ballot,
      });
    });
  }

  promiseResponse(ask: PrepMessage): LivePromResponse | undefined {
    if (ask.proposalNumber > this.lastProposalNumber) {
      this.lastProposalNumber = ask.proposalNumber;
      return {
        status: STATUS.promise,
        previousProposalNumber: this.paxosLedger.length - 1,
        previousAcceptedValue: this.paxosLedger.at(-1)?.leaderProposal, // ?? undefined,
      };
    }
  }

  async ballotReceipt(ask: BallotMessage) {
    if (ask.proposalNumber === this.lastProposalNumber) {
      const ballot = {
        proposalNumber: ask.proposalNumber,
        voteCount: 0,
        leaderProposal: ask.leaderProposal,
      };
      this.paxosLedger[ask.proposalNumber] = ballot;

      await this.sendVoteConfirms(ballot);
    }
  }

  voteReceipt(ballot: LedgerEntry) {
    if (!this.paxosLedger[ballot.proposalNumber]) {
      this.paxosLedger[ballot.proposalNumber] = ballot;
    }
    this.paxosLedger[ballot.proposalNumber].voteCount++;
    if (this.paxosLedger[ballot.proposalNumber].voteCount > this.neighbors.length / 2) {
      leader.leader = ballot.leaderProposal;
    }
    console.log(this.paxosLedger);
  }
}
