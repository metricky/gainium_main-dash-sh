import { useUsdRateService } from './useUsdRateService';

export function useUsdRate() {
  const { rate } = useUsdRateService();

  return {
    rate,
  };
}
