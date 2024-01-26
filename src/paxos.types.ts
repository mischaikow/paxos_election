export interface PrepMessage {
  proposalNumber: number;
}

export interface LivePromResponse {
  status: 'nack' | 'promise';
  neighbor: string;
  previousProposalNumber: number;
  previousAcceptedValue: string | undefined;
}

export interface DeadPromResponse {
  status: 'failure';
  neighbor: string;
}

export type PromResponse = LivePromResponse | DeadPromResponse;
