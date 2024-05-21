import { STANDING, randomIntFromInterval, sleep } from './helper.js';
import { Ballot, LedgerEntry, LivePromResponse, PrepMessage, PromResponse, VoteConfirm } from './paxos.types.js';
import { Leader } from './leader.js';
import { leader } from './app.js';
import { myFetch } from './myFetch.js';
import { ChildData } from './helper.types.js';

export class Paxos {
  me: ChildData;
  meApi: number;
  neighborApis: number[];
  previousProposer: number | null;
  previousProposalNumber: number;
  paxosLedger: LedgerEntry[];

  constructor(me: ChildData, neighbors: number[]) {
    this.me = me;
    this.meApi = me.portApi;
    this.neighborApis = neighbors.filter((n) => {
      return n !== this.meApi;
    });
    this.previousProposer = null;
    this.previousProposalNumber = -1;
    this.paxosLedger = [];
  }

  async newElection(leader: Leader) {
    console.log(`${this.me.nodeName} launched an election`);
    while (!leader.leader) {
      await this.paxosProtocol();
      await sleep(randomIntFromInterval(this.neighborApis.length * 150, this.neighborApis.length * 500));
    }
  }

  async paxosProtocol() {
    console.log(`${this.me.nodeName} - ${this.previousProposalNumber + 1} round of Paxos kicked off`);
    const ballot = await this.prepareBallot(this.previousProposalNumber + 1);
    if (ballot !== undefined) {
      console.log(`${this.me.nodeName} - Vote sent - ${ballot.proposalNumber} for ${ballot.leaderProposal}`);
      this.sendBallot(ballot);
    }
  }

  async prepareBallot(proposalNumber: number): Promise<Ballot | undefined> {
    const responses = await Promise.allSettled(
      this.neighborApis.map((neighbor) => {
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
          responseCounter = responseCounter - this.neighborApis.length;
        }
      }
    }

    if (responseCounter > this.neighborApis.length / 2) {
      return {
        proposer: this.meApi,
        proposalNumber: proposalNumber,
        leaderProposal: latestAnswer ?? this.meApi,
      };
    }
  }

  async sendOnePrepareBallot(neighbor: number, proposalNumber: number): Promise<PromResponse> {
    const body = {
      proposer: this.meApi,
      proposalNumber: proposalNumber,
    };

    try {
      const response = await myFetch(`http://localhost:${neighbor}/prepare_ballot`, {
        retries: 2,
        retryDelay: 250,
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      });
      return (await response.json()) as PromResponse;
    } catch (error) {
      console.log(`${this.me.nodeName} - ballot prep to ${neighbor} failed`);
      return { standing: 'failure' };
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

  sendBallot(ballot: Ballot): void {
    this.neighborApis.map(async (neighbor) => {
      try {
        await myFetch(`http://localhost:${neighbor}/ballot_box`, {
          retries: 2,
          retryDelay: 250,
          method: 'post',
          body: JSON.stringify(ballot),
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.log(`${this.meApi} - ballot ${neighbor} failed`);
      }
    });

    const myBallot: VoteConfirm = { ...ballot, voter: this.meApi };
    this.ballotReceipt(myBallot);
  }

  async ballotReceipt(ballot: Ballot) {
    if (
      (ballot.proposalNumber === this.previousProposalNumber && ballot.proposer === this.previousProposer) ||
      ballot.proposer === this.meApi
    ) {
      const voteConfirm: VoteConfirm = {
        ...ballot,
        voter: this.meApi,
      };

      if (this.voteReceipt(voteConfirm)) {
        await this.sendVoteConfirms(voteConfirm);
      }
    }
  }

  async sendVoteConfirms(ballot: Ballot) {
    this.neighborApis.map(async (neighbor) => {
      try {
        await myFetch(`http://localhost:${neighbor}/vote_confirm`, {
          retries: 2,
          retryDelay: 250,
          method: 'post',
          body: JSON.stringify(ballot),
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.log(`Unable to send voteConfirm to ${neighbor}`);
      }
    });
  }

  voteReceipt(ballot: Ballot) {
    console.log(`${this.me.nodeName} - got votes`);
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

    if (this.paxosLedger[ballot.proposalNumber].voteCount > this.neighborApis.length / 2) {
      leader.assignLeader(ballot.leaderProposal);
      console.log(`Leader elected - ${this.me.nodeName}`);
    }

    return true;
  }

  printLedger() {
    console.log(this.paxosLedger);
    return this.paxosLedger;
  }
}
