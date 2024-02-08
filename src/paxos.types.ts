export interface LedgerEntry {
  proposer: number;
  proposalNumber: number;
  voteCount: number;
  leaderProposal: number;
}

export interface PrepMessage {
  proposer: number;
  proposalNumber: number;
}

export interface Ballot {
  proposer: number;
  proposalNumber: number;
  leaderProposal: number;
}

export interface VoteConfirm {
  proposer: number;
  proposalNumber: number;
  leaderProposal: number;
  voter: number;
}

export interface LivePromResponse {
  standing: 'promise' | 'nack';
  previousVotedNumber: number;
  previousAcceptedValue: number | undefined;
}

export interface DeadPromResponse {
  standing: 'failure';
}

export type PromResponse = LivePromResponse | DeadPromResponse;
