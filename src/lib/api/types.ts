export type ReturnResult<T> =
  | {
      status: 'OK';
      reason: null;
      data: T;
      total?: number;
      counts?: { recent: number; deals: number; alerts: number };
    }
  | {
      status: 'NOTOK';
      reason: string;
      data: null;
      total?: number;
      counts?: { recent: number; deals: number; alerts: number };
    };

export type FetchResult<T, Q extends string> =
  | { errors: { message: string }[]; data: undefined }
  | {
      errors: undefined;
      data: {
        [key in Q]: ReturnResult<T>;
      };
    };
