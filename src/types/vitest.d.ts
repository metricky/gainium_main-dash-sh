/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'vitest' {
  export type TestFn = (...args: any[]) => void;
  export const describe: TestFn;
  export const it: TestFn;
  export const expect: any;
  export const beforeEach: TestFn;
}
