/* eslint-disable @typescript-eslint/ban-ts-comment */

import { ExchangeEnum, type StoreCandles } from '@/types';
import { dispatchCandlesDbEvent } from '@/constants/backtest';
import DB, { handleError } from '@/utils/indexedDb';

export const DBCredentials = {
  version: 2,
  store: 'Candles',
  dbName: 'Gainium',
};

const initDb = async () => {
  const db = new DB<StoreCandles>(
    DBCredentials,
    async (database, oldVersion, newVersion, tx, _ev, he) => {
      database.onerror = (event) =>
        // @ts-ignore
        he(`Error in update DB ${event.target?.error}`);
      tx.onerror = (event) => {
        he(
          // @ts-ignore
          `TX upgrade error ${event.target?.error}. ID: ${id}`
        );
      };
      const stores = database.objectStoreNames;
      if (!stores.contains(DBCredentials.store)) {
        database.createObjectStore(DBCredentials.store, {
          keyPath: 'id',
        });
      }
      if (oldVersion === 1 && newVersion === 2) {
        const objectStore = tx.objectStore(DBCredentials.store);
        const entries = (await objectStore.getAll()) as StoreCandles[] | null;
        for await (const e of entries ?? []) {
          if (
            [
              ExchangeEnum.binance,
              ExchangeEnum.binanceCoinm,
              ExchangeEnum.binanceUsdm,
            ].includes(e.exchange)
          ) {
            objectStore.delete(e.id);
          }
        }
      }
      await tx.done;
    }
  );
  return db;
};

export const getAll = async (): Promise<StoreCandles[]> => {
  try {
    const db = await initDb();
    return await db.getAll();
  } catch (e) {
    handleError(
      `Catch error in get all ${(e as Error).message}`,
      DBCredentials.store
    );
    return [];
  }
};

export const getById = async (
  id: string,
  full = false
): Promise<StoreCandles | undefined | null> => {
  try {
    const db = await initDb();
    return await db.getById(id, full);
  } catch (e) {
    handleError(
      `Catch error in get all ${(e as Error).message}`,
      DBCredentials.store
    );
    return null;
  }
};

export const removeId = async (id: string): Promise<StoreCandles[]> => {
  try {
    const db = await initDb();
    const result = await db.removeId(id);
    dispatchCandlesDbEvent();
    return result;
  } catch (e) {
    handleError(
      `Catch error in remove id ${(e as Error).message}. ID: ${id}`,
      DBCredentials.store
    );
    return [];
  }
};

export const removeAll = async (): Promise<StoreCandles[]> => {
  try {
    const db = await initDb();
    const result = await db.removeAll();
    dispatchCandlesDbEvent();
    return result;
  } catch (e) {
    handleError(
      `Catch error in remove all ${(e as Error).message}`,
      DBCredentials.store
    );
    return [];
  }
};

export const save = async (data: StoreCandles): Promise<boolean> => {
  try {
    const db = await initDb();
    const result = await db.save(data);
    if (result) {
      dispatchCandlesDbEvent();
    }
    return result;
  } catch (e) {
    const error = (e as Error)?.message || e;
    if (error && `${error}` !== 'QuotaExceededError') {
      handleError(`Catch error in save ${error}`, DBCredentials.store);
    }
    return false;
  }
};
