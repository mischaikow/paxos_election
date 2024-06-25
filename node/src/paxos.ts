import { MSG_REQ_NEIGHBORS, STANDING } from './constants.js';
import { Ballot, LedgerEntry, LivePromResponse, PrepMessage, PromResponse, VoteConfirm } from './paxos.types.js';
import { LocalNode } from './localNode.js';
import { randomIntFromInterval, sleep } from './util.js';

export class Paxos {
  me: LocalNode;
  previousProposerApi: number | null;
  previousProposalNumber: number;
  paxosLedger: LedgerEntry[];

  constructor(me: LocalNode) {
    this.me = me;
    this.previousProposerApi = null;
    this.previousProposalNumber = -1;
    this.paxosLedger = [];
  }

  async newElection() {
    console.log(`[${this.me.name}] Paxos election launched`);
    while (!this.me.leader) {
      await this.paxosProtocol();
      await sleep(randomIntFromInterval(this.me.neighborhood.length * 150, this.me.neighborhood.length * 500));
    }
  }

  async paxosProtocol() {
    console.log(`[${this.me.name}] ${this.previousProposalNumber + 1} round of Paxos launched`);
    const ballot = await this.prepareBallot(this.previousProposalNumber + 1);
    if (ballot !== undefined) {
      console.log(
        `[${this.me.name}] Sending vote for ${ballot.leaderProposal} with ballot number ${ballot.proposalNumber}`,
      );
      this.sendBallot(ballot);
    }
  }

  async prepareBallot(proposalNumber: number): Promise<Ballot | undefined> {
    const responses = await Promise.allSettled(
      this.me.neighborhood
        .filter((neighbor) => {
          return neighbor.portApi !== this.me.portApi;
        })
        .map((neighbor) => {
          return this.sendOnePreparedBallot(neighbor.portApi, proposalNumber);
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
          responseCounter = responseCounter - this.me.neighborhood.length + 1;
        }
      }
    }

    if (responseCounter > this.me.neighborhood.length / 2) {
      return {
        proposerApi: this.me.portApi,
        proposalNumber: proposalNumber,
        leaderProposal: latestAnswer ?? this.me.name,
      };
    }
  }

  async sendOnePreparedBallot(neighborApi: number, proposalNumber: number): Promise<PromResponse> {
    const body: PrepMessage = {
      proposerApi: this.me.portApi,
      proposalNumber: proposalNumber,
    };

    try {
      const response = await fetch(`http://localhost:${neighborApi}/prepare_ballot`, {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw 'Unresponsive neighbor';
      }
      return (await response.json()) as PromResponse;
    } catch (error) {
      console.log(`[${this.me.name}] sendOnePreparedBallot to ${neighborApi} failed with error \n`);
      console.debug(error);
      if (process.send) {
        process.send(MSG_REQ_NEIGHBORS);
      }
      return { standing: 'failure' };
    }
  }

  promiseResponse(ask: PrepMessage): LivePromResponse {
    if (ask.proposalNumber > this.previousProposalNumber) {
      this.previousProposalNumber = ask.proposalNumber;
      this.previousProposerApi = ask.proposerApi;
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
    this.me.neighborhood
      .filter((neighbor) => {
        return neighbor.portApi !== this.me.portApi;
      })
      .map(async (neighbor) => {
        try {
          const response = await fetch(`http://localhost:${neighbor.portApi}/ballot_box`, {
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
            body: JSON.stringify(ballot),
          });
          if (!response.ok) {
            throw 'Unresponsive neighbor';
          }
        } catch (error) {
          console.log(
            `[${this.me.name}] sendBallot to ${neighbor.nodeName} located at ${neighbor.portApi} failed with error\n`,
          );
          console.debug(error);
          if (process.send) {
            process.send(MSG_REQ_NEIGHBORS);
          }
        }
      });

    const myBallot: VoteConfirm = { ...ballot, voterApi: this.me.portApi };
    this.ballotReceipt(myBallot);
  }

  ballotReceipt(ballot: Ballot) {
    console.debug(`[${this.me.name}] Received ballot from port ${ballot.proposerApi}.`);
    if (
      (ballot.proposalNumber === this.previousProposalNumber && ballot.proposerApi === this.previousProposerApi) ||
      ballot.proposerApi === this.me.portApi
    ) {
      const voteConfirm: VoteConfirm = {
        ...ballot,
        voterApi: this.me.portApi,
      };

      if (this.voteReceipt(voteConfirm)) {
        this.sendVoteConfirms(voteConfirm);
      }
    }
  }

  sendVoteConfirms(ballot: Ballot) {
    this.me.neighborhood
      .filter((neighbor) => {
        return neighbor.portApi !== this.me.portApi;
      })
      .map(async (neighbor) => {
        try {
          const response = await fetch(`http://localhost:${neighbor.portApi}/vote_confirm`, {
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
            body: JSON.stringify(ballot),
          });
          if (!response.ok) {
            throw 'Unresponsive neighbor';
          }
        } catch (error) {
          console.log(`[${this.me.name}] Unable to send vote confirm to ${neighbor.nodeName}`);
          if (process.send) {
            process.send(MSG_REQ_NEIGHBORS);
          }
        }
      });
  }

  voteReceipt(ballot: Ballot): boolean {
    if (!this.paxosLedger[ballot.proposalNumber]) {
      this.paxosLedger[ballot.proposalNumber] = {
        proposerApi: ballot.proposerApi,
        proposalNumber: ballot.proposalNumber,
        voteCount: 1,
        leaderProposal: ballot.leaderProposal,
      };
    } else {
      if (this.paxosLedger[ballot.proposalNumber].proposerApi === ballot.proposerApi) {
        this.paxosLedger[ballot.proposalNumber].voteCount++;
      } else {
        return false;
      }
    }

    if (this.paxosLedger[ballot.proposalNumber].voteCount > this.me.neighborhood.length / 2) {
      this.me.assignLeader(ballot.leaderProposal);
      console.log(`[${this.me.name}] Leader elected -- ${ballot.leaderProposal}`);
    }

    return true;
  }

  printLedger() {
    console.log(this.paxosLedger);
    return this.paxosLedger;
  }
}
