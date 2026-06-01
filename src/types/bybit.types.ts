export type CandleBybit = {
  start: number;
  end: number;
  interval: string;
  open: string;
  close: string;
  high: string;
  low: string;
  volume: string;
  turnover: string;
  confirm: boolean;
  timestamp: number;
}[];

export type CandlesBybitResponse = {
  retMsg: string;
  result: { list: CandleBybit[] };
};
