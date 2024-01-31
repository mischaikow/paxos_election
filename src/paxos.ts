import fetch from 'node-fetch';
import { leader } from './app.js';
import { STANDING } from './helper.js';
import { BallotMessage, LedgerEntry, LivePromResponse, PrepMessage, PromResponse } from './paxos.types.js';

export class Paxos {
  me: string;
  neighbors: string[];
  previousProposalNumber: number;
  paxosLedger: LedgerEntry[];

  constructor(me: string, neighbors: string[]) {
    this.me = me;
    this.neighbors = neighbors;
    this.previousProposalNumber = -1;
    this.paxosLedger = [];
  }

  async newElection() {
    while (!leader.leader) {
      await this.paxosProtocol();
      //await sleep(randomIntFromInterval(250000, 350000));
    }
  }

  async paxosProtocol() {
    const ballot = await this.prepareBallot(this.previousProposalNumber + 1);
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
      if (response.status === 'fulfilled' && response.value.standing === STANDING.promise) {
        responseCounter++;
        if (response.value.previousVotedNumber > lastProposalNumber) {
          lastProposalNumber = response.value.previousVotedNumber;
          latestAnswer = response.value.previousAcceptedValue;
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
    const body = {
      proposalNumber: proposalNumber,
    };
    try {
      const response = await fetch(`http://${neighbor}:3000/prepare_ballot`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      });
      return await response.json();
    } catch (error) {
      return { standing: STANDING.failure };
    }
  }

  sendBallot(ballot: BallotMessage) {
    this.neighbors.map((neighbor) => {
      fetch(`http://${neighbor}:3000/ballot_box`, {
        method: 'post',
        body: JSON.stringify(ballot),
        headers: { 'Content-Type': 'application/json' },
      });
    });
  }

  sendVoteConfirms(ballot: LedgerEntry) {
    this.neighbors.map((neighbor) => {
      fetch(`http://${neighbor}:3000/vote_confirm`, {
        method: 'post',
        body: JSON.stringify(ballot),
        headers: { 'Content-Type': 'application/json' },
      });
    });
  }

  promiseResponse(ask: PrepMessage): LivePromResponse | undefined {
    if (ask.proposalNumber > this.previousProposalNumber) {
      this.previousProposalNumber = ask.proposalNumber;
      return {
        standing: STANDING.promise,
        previousVotedNumber: this.paxosLedger.length - 1,
        previousAcceptedValue: this.paxosLedger.at(-1)?.leaderProposal, // ?? undefined,
      };
    }
  }

  async ballotReceipt(ask: BallotMessage) {
    if (ask.proposalNumber === this.previousProposalNumber) {
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
  }
}
