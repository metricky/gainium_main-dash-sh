import { useAuthStore } from '@/stores/authStore';
import { globalVariablesStore } from '@/stores/globalVariablesStore';
import { useUIStore } from '@/stores/uiStore';
import type { GlobalVariable } from '@/types/globalVariables';
import { useQuery } from '@tanstack/react-query';

interface VariableDetailsResult {
  variable: GlobalVariable | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

export const useVariableDetails = (
  variableId: string | null
): VariableDetailsResult => {
  const { tokens } = useAuthStore();
  const isLiveTrading = useUIStore((s) => s.isLiveTrading);

  const query = useQuery({
    queryKey: ['global-variable', variableId, isLiveTrading],
    enabled: Boolean(variableId && tokens?.accessToken),
    queryFn: async (): Promise<GlobalVariable | null> =>
      (await globalVariablesStore.getVariablesByIds(variableId))?.[0] ?? null,
    staleTime: 5 * 60 * 1000,
  });

  return {
    variable: query.data ?? null,
    isLoading: query.isLoading,
    error: (query.error as Error) ?? null,
    refetch: query.refetch,
  };
};

export default useVariableDetails;
