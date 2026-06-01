import GridBacktester from '@gainium/backtester/dist/grid';

import { type GRIDBacktestingInput } from '@gainium/backtester/dist/types';
import getLoadFn from './loadFn';

class GridBacktesting extends GridBacktester {
  private stopFn: (() => void) | null = null;

  constructor(
    settings: GRIDBacktestingInput,
    updateProgress?: (value: number, text: string, step?: number) => void,
    handleErrorByCandles?: (msg: string) => void
  ) {
    settings.userFee = Math.max(settings.userFee, 0);
    super({ ...settings });
    const fns = getLoadFn(this.exchange, updateProgress, handleErrorByCandles);
    if (fns.load) {
      this.loadData = fns.load;
    }

    if (fns.stop) {
      this.stopFn = fns.stop;
    }
  }

  public stopBacktest() {
    if (this.stopFn) {
      this.stopFn();
    }
    this.stop = true;
  }
}

export default GridBacktesting;
