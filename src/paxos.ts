import { STANDING, randomIntFromInterval, sleep } from './helper.js';
import { Ballot, LedgerEntry, LivePromResponse, PrepMessage, PromResponse, VoteConfirm } from './paxos.types.js';
import { Leader } from './leader.js';
import { leader } from './app.js';
import { myFetch } from './myFetch.js';

export class Paxos {
  me: string;
  neighbors: string[];
  previousProposer: string | null;
  previousProposalNumber: number;
  paxosLedger: LedgerEntry[];

  constructor(me: string, neighbors: string[]) {
    this.me = me;
    this.neighbors = neighbors.filter((n) => {
      return n !== me;
    });
    this.previousProposer = null;
    this.previousProposalNumber = -1;
    this.paxosLedger = [];
  }

  async newElection(leader: Leader) {
    console.log(`${this.me} launched an election`);
    while (!leader.leader) {
      await this.paxosProtocol();
      await sleep(randomIntFromInterval(this.neighbors.length * 150, this.neighbors.length * 500));
    }
  }

  async paxosProtocol() {
    console.log(`1 round of Paxos kicked off - ${this.previousProposalNumber + 1}`);
    const ballot = await this.prepareBallot(this.previousProposalNumber + 1);
    if (ballot !== undefined) {
      console.log(`Vote sent - ${ballot.proposalNumber} for ${ballot.leaderProposal}`);
      await this.sendBallot(ballot);
    }
  }

  async prepareBallot(proposalNumber: number): Promise<Ballot | undefined> {
    const responses = await Promise.allSettled(
      this.neighbors.map((neighbor) => {
        return this.sendOnePrepareBallot(neighbor, proposalNumber);
      }),
    );

    let responseCounter = 1;
    let lastProposalNumber = -1;
    let latestAnswer;

    for (const response of responses) {
      if (response.status === 'fulfilled') {
        if (response.value.standing === STANDING.promise) {
          responseCounter++;
          if (response.value.previousVotedNumber > lastProposalNumber) {
            lastProposalNumber = response.value.previousVotedNumber;
            latestAnswer = response.value.previousAcceptedValue;
          }
        } else if (response.value.standing === STANDING.nack) {
          this.previousProposalNumber = response.value.previousVotedNumber;
        }
      }
    }

    if (responseCounter > this.neighbors.length / 2) {
      return {
        proposer: this.me,
        proposalNumber: proposalNumber,
        leaderProposal: latestAnswer ?? this.me,
      };
    }
  }

  async sendOnePrepareBallot(neighbor: string, proposalNumber: number): Promise<PromResponse> {
    const body = {
      proposer: this.me,
      proposalNumber: proposalNumber,
    };

    try {
      const response = await myFetch(`http://${neighbor}:3000/prepare_ballot`, {
        retries: 2,
        retryDelay: 250,
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      });
      return (await response.json()) as PromResponse;
    } catch (error) {
      console.log(error);
      return { standing: STANDING.failure };
    }
  }

  promiseResponse(ask: PrepMessage): LivePromResponse {
    if (ask.proposalNumber > this.previousProposalNumber) {
      this.previousProposalNumber = ask.proposalNumber;
      this.previousProposer = ask.proposer;
      return {
        standing: STANDING.promise,
        previousVotedNumber: this.paxosLedger.length - 1,
        previousAcceptedValue: this.paxosLedger.at(-1)?.leaderProposal,
      };
    } else {
      return {
        standing: STANDING.nack,
        previousVotedNumber: this.paxosLedger.length - 1,
        previousAcceptedValue: this.paxosLedger.at(-1)?.leaderProposal,
      };
    }
  }

  sendBallot(ballot: Ballot) {
    this.neighbors.map(async (neighbor) => {
      try {
        await myFetch(`http://${neighbor}:3000/ballot_box`, {
          retries: 2,
          retryDelay: 250,
          method: 'post',
          body: JSON.stringify(ballot),
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.log(error);
      }
    });

    const myBallot: VoteConfirm = { ...ballot, voter: this.me };
    this.ballotReceipt(myBallot);
  }

  async ballotReceipt(ballot: Ballot) {
    if (
      (ballot.proposalNumber === this.previousProposalNumber && ballot.proposer === this.previousProposer) ||
      ballot.proposer === this.me
    ) {
      const voteConfirm: VoteConfirm = {
        ...ballot,
        voter: this.me,
      };

      if (this.voteReceipt(voteConfirm)) {
        await this.sendVoteConfirms(voteConfirm);
      }
    }
  }

  async sendVoteConfirms(ballot: Ballot) {
    this.neighbors.map(async (neighbor) => {
      try {
        await myFetch(`http://${neighbor}:3000/vote_confirm`, {
          retries: 2,
          retryDelay: 250,
          method: 'post',
          body: JSON.stringify(ballot),
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.log(error);
      }
    });
  }

  voteReceipt(ballot: Ballot) {
    if (!this.paxosLedger[ballot.proposalNumber]) {
      this.paxosLedger[ballot.proposalNumber] = {
        proposer: ballot.proposer,
        proposalNumber: ballot.proposalNumber,
        voteCount: 1,
        leaderProposal: ballot.leaderProposal,
      };
    } else {
      if (this.paxosLedger[ballot.proposalNumber].proposer === ballot.proposer) {
        this.paxosLedger[ballot.proposalNumber].voteCount++;
      } else {
        return false;
      }
    }

    if (this.paxosLedger[ballot.proposalNumber].voteCount > this.neighbors.length / 2) {
      leader.leader = ballot.leaderProposal;
      console.log(`Leader elected - ${ballot.leaderProposal}`);
    }

    return true;
  }

  printLedger() {
    console.log(this.paxosLedger);
    return this.paxosLedger;
  }
}
