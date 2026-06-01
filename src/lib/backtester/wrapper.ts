import DCABacktester from '@gainium/backtester/dist/dca';

import { type DCABacktestingInput } from '@gainium/backtester/dist/types';
import getLoadFn from './loadFn';

class DCABacktesting extends DCABacktester {
  private stopFn: (() => void) | null = null;

  constructor(
    settings: DCABacktestingInput,
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

export default DCABacktesting;
