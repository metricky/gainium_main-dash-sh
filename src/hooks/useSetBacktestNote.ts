import { useMutation, useQueryClient } from '@tanstack/react-query';

import { GraphQLClient, type ReturnResult } from '@/lib/api';
import { dealQueries } from '@/lib/api/GraphQLQueries-deal-queries';
import { logger } from '@/lib/loggerInstance';
import { toast } from '@/lib/toast';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { BotTypesEnum } from '@/types';

export interface SetBacktestNoteInput {
  id: string;
  note: string;
  type: BotTypesEnum;
}

export type SetBacktestNoteResult = ReturnResult<string>;

/**
 * Mutation hook to set/update a note on a backtest history entry.
 * Works for DCA (regular), Combo, and Grid backtests via the
 * `setBacktestTextFields` GraphQL mutation.
 */
export function useSetBacktestNote() {
  const queryClient = useQueryClient();
  const { tokens } = useAuthStore();
  const isLiveTrading = useUIStore((s) => s.isLiveTrading);

  return useMutation<SetBacktestNoteResult, Error, SetBacktestNoteInput>({
    mutationKey: ['set-backtest-note'],
    mutationFn: async ({ id, note, type }) => {
      if (!tokens?.accessToken) {
        throw new Error('Authentication required to update backtest note.');
      }
      if (!id) {
        throw new Error('Backtest ID is required to update note.');
      }

      const endpoint =
        import.meta.env['VITE_API_ENDPOINT'] || 'http://localhost:4000';
      const client = new GraphQLClient(
        endpoint,
        tokens.accessToken,
        !isLiveTrading
      );

      const { query, variables } = dealQueries.setBacktestTextFields({
        id,
        note,
        type,
      });

      const response = await client.request<{
        setBacktestTextFields: SetBacktestNoteResult;
      }>(query, variables);

      const payload =
        (response?.setBacktestTextFields as
          | SetBacktestNoteResult
          | undefined) ?? (response as unknown as SetBacktestNoteResult);

      if (!payload || payload.status !== 'OK') {
        const reason = payload?.reason ?? 'Failed to update backtest note.';
        logger.error('[useSetBacktestNote] Update failed', { id, reason });
        throw new Error(reason);
      }

      logger.info('[useSetBacktestNote] Note updated successfully', {
        id,
        type,
      });
      return payload;
    },
    onSuccess: (_data, variables) => {
      // Invalidate the relevant backtest query based on bot type
      if (variables.type === BotTypesEnum.grid) {
        queryClient.invalidateQueries({ queryKey: ['getGridBacktests'] });
      } else {
        // DCA and Combo share the same getBacktests endpoint
        queryClient.invalidateQueries({ queryKey: ['getBacktests'] });
      }
    },
    onError: (error) => {
      logger.error('[useSetBacktestNote] Failed to update backtest note', {
        error: error.message,
      });
      toast.error(`Cannot update backtest note: ${error.message}`);
    },
  });
}
