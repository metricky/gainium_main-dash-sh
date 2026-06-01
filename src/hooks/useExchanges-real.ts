import type { ExchangeInUser } from '../types/exchange.types';
import { useExchanges as useExchangesCore } from './useExchanges';

// Real exchange response type based on GraphQL schema
export interface GetAllExchangesResponse {
  exchanges: ExchangeInUser[];
}

export function useExchanges() {
  const data = useExchangesCore();

  return data;
}
