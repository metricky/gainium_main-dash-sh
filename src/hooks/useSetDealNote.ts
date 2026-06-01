import { useMutation, useQueryClient } from '@tanstack/react-query';

import { GraphQLClient, type ReturnResult } from '@/lib/api';
import { dealQueries } from '@/lib/api/GraphQLQueries-deal-queries';
import { logger } from '@/lib/loggerInstance';
import { toast } from '@/lib/toast';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { BotTypesEnum } from '@/types';

export interface SetDealNoteInput {
  id: string;
  note: string;
  type?: BotTypesEnum;
}

export type SetDealNoteResult = ReturnResult<string>;

/**
 * Mutation hook to set/update a note on a DCA deal.
 * Mirrors the setDealNote mutation from main-dash terminal component.
 */
export function useSetDealNote() {
  const queryClient = useQueryClient();
  const { tokens } = useAuthStore();
  const isLiveTrading = useUIStore((s) => s.isLiveTrading);

  return useMutation<SetDealNoteResult, Error, SetDealNoteInput>({
    mutationKey: ['set-deal-note'],
    mutationFn: async ({ id, note, type = BotTypesEnum.dca }) => {
      if (!tokens?.accessToken) {
        throw new Error('Authentication required to update deal note.');
      }

      if (!id) {
        throw new Error('Deal ID is required to update note.');
      }

      const endpoint =
        import.meta.env['VITE_API_ENDPOINT'] || 'http://localhost:4000';
      const client = new GraphQLClient(
        endpoint,
        tokens.accessToken,
        !isLiveTrading
      );

      const { query, variables } = dealQueries.setDealNote({ id, note, type });

      const response = await client.request<{
        setDealNote: SetDealNoteResult;
      }>(query, variables);

      const payload =
        (response?.setDealNote as SetDealNoteResult | undefined) ??
        (response as unknown as SetDealNoteResult);

      if (!payload || payload.status !== 'OK') {
        const reason = payload?.reason ?? 'Failed to update deal note.';
        logger.error('[useSetDealNote] Update failed', { id, reason });
        throw new Error(reason);
      }

      logger.info('[useSetDealNote] Note updated successfully', { id });
      return payload;
    },
    onSuccess: (_data, _variables) => {
      // Invalidate deal queries so the note persists across refreshes
      queryClient.invalidateQueries({ queryKey: ['getDCADeals'] });
      queryClient.invalidateQueries({ queryKey: ['dcaDealList'] });
    },
    onError: (error) => {
      logger.error('[useSetDealNote] Failed to update deal note', {
        error: error.message,
      });
      toast.error(`Cannot update deal note: ${error.message}`);
    },
  });
}
