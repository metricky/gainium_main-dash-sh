import type { BotVars } from '@/types';
import type { VarBindingPath } from './useBotVarBinding';

export const buildBotVars = (
  current: BotVars | null,
  path: VarBindingPath,
  variableId: string
) => {
  const nextPaths = [
    ...(current?.paths ?? []).filter((entry) => entry.path !== path),
    { path, variable: variableId },
  ];
  const nextList = Array.from(
    new Set([
      ...(current?.list ?? []),
      ...nextPaths.map((entry) => entry.variable),
    ])
  );

  return {
    list: nextList,
    paths: nextPaths,
  } satisfies BotVars;
};

export const pruneBotVars = (current: BotVars | null, path: string) => {
  if (!current) {
    return null;
  }

  const nextPaths = current.paths.filter((entry) => entry.path !== path);
  if (nextPaths.length === 0) {
    return null;
  }

  const nextList = Array.from(
    new Set(nextPaths.map((entry) => entry.variable))
  );

  return {
    list: nextList,
    paths: nextPaths,
  } satisfies BotVars;
};
