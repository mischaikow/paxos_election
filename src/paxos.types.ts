export interface LedgerEntry {
  proposalNumber: number;
  voteCount: number;
  leaderProposal: string;
}

export interface PrepMessage {
  proposalNumber: number;
}

export interface LivePromResponse {
  standing: 'promise';
  previousVotedNumber: number;
  previousAcceptedValue: string | undefined;
}

export interface DeadPromResponse {
  standing: 'failure';
}

export type PromResponse = LivePromResponse | DeadPromResponse;

export interface BallotMessage {
  proposalNumber: number;
  leaderProposal: string;
}
