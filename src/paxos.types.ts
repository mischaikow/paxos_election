export interface LedgerEntry {
  proposer: string;
  proposalNumber: number;
  voteCount: number;
  leaderProposal: string;
}

export interface PrepMessage {
  proposer: string;
  proposalNumber: number;
}

export interface Ballot {
  proposer: string;
  proposalNumber: number;
  leaderProposal: string;
}

export interface VoteConfirm {
  proposer: string;
  proposalNumber: number;
  leaderProposal: string;
  voter: string;
}

export interface LivePromResponse {
  standing: 'promise' | 'nack';
  previousVotedNumber: number;
  previousAcceptedValue: string | undefined;
}

export interface DeadPromResponse {
  standing: 'failure';
}

export type PromResponse = LivePromResponse | DeadPromResponse;
