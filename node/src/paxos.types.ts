export interface PrepMessage {
  proposerApi: number;
  proposalNumber: number;
}

export interface Ballot extends PrepMessage {
  leaderProposal: string;
}

export interface LedgerEntry extends Ballot {
  voteCount: number;
}

export interface VoteConfirm extends Ballot {
  voterApi: number;
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
