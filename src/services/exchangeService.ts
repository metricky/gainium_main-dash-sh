import { GraphQLClient, type ReturnResult } from '@/lib/api';
import { exchangeQueries } from '@/lib/api/GraphQLQueries-exchange-queries';
import { logger } from '@/lib/loggerInstance';
import type { ExchangeInUser } from '../types/exchange.types';
import type {
  AddExchangeInput,
  UpdateExchangeInput,
  DeleteExchangeInput,
  SetHedgeModeInput,
  SetZeroFeeInput,
  UpdateBalanceInput,
} from '../hooks/useExchangeMutations';

/**
 * Exchange service for GraphQL operations
 * Handles all exchange-related API calls using the GraphQL client
 */
export class ExchangeService {
  private client: GraphQLClient;

  constructor(client: GraphQLClient) {
    this.client = client;
  }

  /**
   * Add a new exchange
   * Note: The backend may return multiple exchanges for certain providers (e.g., Bybit returns spot, linear, and inverse)
   */
  async addExchange(input: AddExchangeInput): Promise<ExchangeInUser[]> {
    try {
      logger.info('Adding exchange:', {
        provider: input.provider,
        name: input.name,
      });

      const { query, variables } = exchangeQueries.addExchange(input);
      const response = await this.client.request<{
        addExchange: ReturnResult<ExchangeInUser[]>;
      }>(query, variables);

      if (response.addExchange.status === 'NOTOK') {
        throw new Error(
          response.addExchange.reason || 'Failed to add exchange'
        );
      }

      if (
        !response.addExchange.data ||
        !Array.isArray(response.addExchange.data)
      ) {
        throw new Error('No exchange data returned from server');
      }

      logger.info('Exchange(s) added successfully:', response.addExchange.data);
      return response.addExchange.data;
    } catch (error) {
      logger.error('Failed to add exchange:', error);
      throw error;
    }
  }

  /**
   * Update an existing exchange
   */
  async updateExchange(input: UpdateExchangeInput): Promise<ExchangeInUser> {
    try {
      logger.info('Updating exchange:', { uuid: input.uuid, name: input.name });

      const { query, variables } = exchangeQueries.updateExchange(input);
      const response = await this.client.request<{
        updateExchange: ReturnResult<ExchangeInUser>;
      }>(query, variables);

      if (response.updateExchange.status === 'NOTOK') {
        throw new Error(
          response.updateExchange.reason || 'Failed to update exchange'
        );
      }

      if (!response.updateExchange.data) {
        throw new Error('No exchange data returned from server');
      }

      logger.info(
        'Exchange updated successfully:',
        response.updateExchange.data
      );
      return response.updateExchange.data;
    } catch (error) {
      logger.error('Failed to update exchange:', error);
      throw error;
    }
  }

  /**
   * Delete an exchange
   */
  async deleteExchange(input: DeleteExchangeInput): Promise<string> {
    try {
      logger.info(
        '[delete-exchange] exchangeService.deleteExchange called with input:',
        input
      );

      const { query, variables } = exchangeQueries.deleteExchange(input);
      logger.info('[delete-exchange] GraphQL query:', query);
      logger.info('[delete-exchange] GraphQL variables:', variables);

      const response = await this.client.request<{
        deleteExchange: ReturnResult<string>;
      }>(query, variables);

      logger.info('[delete-exchange] GraphQL response:', response);

      if (response.deleteExchange.status === 'NOTOK') {
        logger.error(
          '[delete-exchange] GraphQL returned NOTOK:',
          response.deleteExchange.reason
        );
        throw new Error(
          response.deleteExchange.reason || 'Failed to delete exchange'
        );
      }

      const message =
        response.deleteExchange.data || 'Exchange deleted successfully';
      logger.info('[delete-exchange] Exchange deleted successfully:', message);
      return message;
    } catch (error) {
      logger.error('[delete-exchange] Failed to delete exchange:', error);
      throw error;
    }
  }

  /**
   * Set hedge mode for an exchange. Server response shape is
   * `setHedgeResponse { status, reason, data: Boolean }`. Empirically
   * `data` echoes the new value (i.e. setHedge(hedge=false) → data=false),
   * NOT a success/fail flag — so we trust `status` alone for outcome.
   */
  async setHedgeMode(
    input: SetHedgeModeInput
  ): Promise<Pick<ExchangeInUser, 'uuid' | 'hedge'>> {
    try {
      logger.info('Setting hedge mode:', input);

      const { query, variables } = exchangeQueries.setHedge(input);
      const response = await this.client.request<{
        setHedge: { status: string; reason?: string; data?: boolean };
      }>(query, variables);

      if (response.setHedge.status === 'NOTOK') {
        throw new Error(response.setHedge.reason || 'Failed to set hedge mode');
      }

      logger.info('Hedge mode updated successfully', { input });
      return { uuid: input.uuid, hedge: input.hedge };
    } catch (error) {
      logger.error('Failed to set hedge mode:', error);
      throw error;
    }
  }

  /**
   * Set zero fee mode for an exchange. Same response shape as setHedge —
   * `data` echoes the new value, not a success flag.
   */
  async setZeroFee(
    input: SetZeroFeeInput
  ): Promise<Pick<ExchangeInUser, 'uuid' | 'zeroFee'>> {
    try {
      logger.info('Setting zero fee:', input);

      const { query, variables } = exchangeQueries.setZeroFee(input);
      const response = await this.client.request<{
        setZeroFee: { status: string; reason?: string; data?: boolean };
      }>(query, variables);

      if (response.setZeroFee.status === 'NOTOK') {
        throw new Error(response.setZeroFee.reason || 'Failed to set zero fee');
      }

      logger.info('Zero fee updated successfully', { input });
      return { uuid: input.uuid, zeroFee: input.value };
    } catch (error) {
      logger.error('Failed to set zero fee:', error);
      throw error;
    }
  }

  /**
   * Update exchange balances
   */
  async updateBalance(input: UpdateBalanceInput): Promise<{ message: string }> {
    try {
      logger.info('Updating balance:', input);

      const { query, variables } = exchangeQueries.updateBalance(input);
      const response = await this.client.request<{
        updateBalance: ReturnResult<{
          result: {
            updateTime: number;
            exchangesTotal: Array<{
              uuid: string;
              totalUsd: number;
            }>;
            updated?: string;
          }[];
        }>;
      }>(query, variables);

      if (response.updateBalance.status === 'NOTOK') {
        throw new Error(
          response.updateBalance.reason || 'Failed to update balance'
        );
      }

      const message = 'Balances updated successfully';
      logger.info('Balance updated successfully');
      return { message };
    } catch (error) {
      logger.error('Failed to update balance:', error);
      throw error;
    }
  }

  /**
   * Update exchange status
   */
  async updateStatus(): Promise<ExchangeInUser[]> {
    try {
      logger.info('Updating exchange status');

      const { query } = exchangeQueries.updateStatus();
      const response = await this.client.request<{
        updateStatus: ReturnResult<ExchangeInUser[]>;
      }>(query);

      if (response.updateStatus.status === 'NOTOK') {
        throw new Error(
          response.updateStatus.reason || 'Failed to update status'
        );
      }

      if (!response.updateStatus.data) {
        throw new Error('No status data returned from server');
      }

      logger.info('Exchange status updated successfully');
      return response.updateStatus.data;
    } catch (error) {
      logger.error('Failed to update exchange status:', error);
      throw error;
    }
  }
}

/**
 * Factory function to create an exchange service instance
 */
export function createExchangeService(
  endpoint: string,
  token?: string,
  paperContext?: boolean
): ExchangeService {
  const client = new GraphQLClient(endpoint, token, paperContext);
  return new ExchangeService(client);
}
