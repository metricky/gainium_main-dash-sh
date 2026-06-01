/**
 * Thin wrapper around `@gainium/backtester/dist/hedge`'s `HedgeBacktesting`.
 *
 * The backtester class needs a `loadData` function to fetch historical
 * candles (lives in `loadFn.ts` and reuses our `Candles` utility). The
 * wrapper also exposes `stopBacktest()` mirroring the DCA wrapper in
 * `./wrapper.ts`, so the caller can cancel a long-running test.
 *
 * Hedge runs are local-only — the server-side `requestServerSideBacktest`
 * union has no hedge variant in `core/src/types/index.ts`, so this is
 * the only path that produces hedge results.
 */
import HedgeBacktester from '@gainium/backtester/dist/hedge';
import { type HedgeBacktestingInput } from '@gainium/backtester/dist/types';
import getLoadFn from './loadFn';

class HedgeBacktesting extends HedgeBacktester {
  private stopFn: (() => void) | null = null;

  constructor(
    settings: HedgeBacktestingInput,
    updateProgress?: (value: number, text: string, step?: number) => void,
    handleErrorByCandles?: (msg: string) => void
  ) {
    settings.longSettings.userFee = Math.max(settings.longSettings.userFee, 0);
    settings.shortSettings.userFee = Math.max(
      settings.shortSettings.userFee,
      0
    );
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

export default HedgeBacktesting;
