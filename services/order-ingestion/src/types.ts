export type AggregatorChannel = 'zipp' | 'munchly';

export interface NormalizedLine {
  externalItemId: string;
  qty: number;
  note: string | null;
}

/** What every aggregator's payload gets mapped down to before it touches the database. */
export interface NormalizedOrder {
  channel: AggregatorChannel;
  externalOrderId: string;
  promiseMinutes: number;
  note: string | null;
  lines: NormalizedLine[];
}

export class IngestError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'IngestError';
  }
}
