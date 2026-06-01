import { useMemo } from 'react';

import {
  ensureBotRegistryBootstrapped,
  resolveBotType,
} from '../../../features/bots/registry';

export interface UseActiveBotTypeOptions {
  botTypeId?: string;
  fallbackId?: string;
  autoBootstrap?: boolean;
}

export function useActiveBotType(options: UseActiveBotTypeOptions = {}) {
  const { botTypeId, fallbackId, autoBootstrap = true } = options;

  if (autoBootstrap) {
    ensureBotRegistryBootstrapped();
  }

  return useMemo(() => {
    try {
      return resolveBotType(botTypeId ?? fallbackId);
    } catch (error) {
      if (fallbackId && fallbackId !== botTypeId) {
        return resolveBotType(fallbackId);
      }
      throw error;
    }
  }, [botTypeId, fallbackId]);
}
