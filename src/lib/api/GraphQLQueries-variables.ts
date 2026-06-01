import { GlobalVariablesTypeEnum } from '@/types';

/**
 * GraphQL queries for Global Variables functionality
 *
 * This module provides all GraphQL operations needed for managing global variables:
 * - Fetching variables with pagination, sorting, and filtering
 * - Creating new variables with validation
 * - Updating existing variables
 * - Deleting variables with safety checks
 * - Retrieving related bots information
 */

export const variableQueries = {
  /**
   * Fetch global variables with advanced filtering and pagination
   * Supports server-side sorting, filtering, and search functionality
   */
  getGlobalVariables: (input: {
    search?: string;
    page?: number;
    pageSize?: number;
    sortModel?: Array<{
      field: string;
      sort: 'asc' | 'desc';
    }>;
    filterModel?: {
      items: Array<{
        field: string;
        operator: string;
        value: string;
      }>;
    };
  }) => {
    const query = `
      query GetGlobalVariables($input: GetGlobalVariablesInput!) {
        getGlobalVariables(input: $input) {
          status
          reason
          data {
            id
            name
            type
            value
            botAmount
          }
          total
        }
      }
    `;
    const variables = { input };
    return { query, variables };
  },

  /**
   * Create a new global variable
   * Includes validation for name uniqueness and value format
   */
  createGlobalVariable: (input: {
    name: string;
    type: GlobalVariablesTypeEnum;
    value: string;
  }) => {
    const query = `
      mutation CreateGlobalVariable($input: CreateGlobalVariableInput!) {
        createGlobalVariable(input: $input) {
          status
          reason
          data {
            id
            name
            type
            value
            botAmount
          }
        }
      }
    `;
    const variables = { input };
    return { query, variables };
  },

  /**
   * Update an existing global variable
   * All associated bots will be restarted after update
   */
  updateGlobalVariable: (input: {
    id: string;
    name: string;
    type: GlobalVariablesTypeEnum;
    value: string;
  }) => {
    const query = `
      mutation UpdateGlobalVariable($input: UpdateGlobalVariableInput!) {
        updateGlobalVariable(input: $input) {
          status
          reason
        }
      }
    `;
    const variables = { input };
    return { query, variables };
  },

  /**
   * Delete a global variable
   * Will fail if variable is currently used by active bots
   */
  deleteGlobalVariable: (input: { id: string }) => {
    const query = `
      mutation DeleteGlobalVariable($input: DeleteGlobalVariableInput!) {
        deleteGlobalVariable(input: $input) {
          status
          reason
        }
      }
    `;
    const variables = { input };
    return { query, variables };
  },

  /**
   * Get specific global variables by their IDs
   * Useful for batch operations or specific lookups
   */
  getGlobalVariablesByIds: (input: { ids: string[] }) => {
    const query = `
      query GetGlobalVariablesByIds($input: GetGlobalVariablesByIdsInput!) {
        getGlobalVariablesByIds(input: $input) {
          status
          reason
          data {
            id
            name
            type
            value
            botAmount
          }
          total
        }
      }
    `;
    const variables = { input };
    return { query, variables };
  },

  /**
   * Get all bots that use a specific global variable
   * Returns bots grouped by type with pagination support
   */
  getGlobalVariableRelatedBots: (input: {
    id: string;
    page?: number;
    pageSize?: number;
  }) => {
    const query = `
      query getGlobalVariableRelatedBots($input: getGlobalVariableRelatedBotsInput!) {
        getGlobalVariableRelatedBots(input: $input) {
          status
          reason
          data {
            type
            total
            bots {
              _id
              name
              status
              paperContext
            }
          }
        }
      }
    `;
    const variables = { input };
    return { query, variables };
  },

  /**
   * Batch update multiple global variables
   * Useful for bulk operations with transaction support
   */
  updateMultipleGlobalVariables: (input: {
    variables: Array<{
      id: string;
      name: string;
      type: GlobalVariablesTypeEnum;
      value: string;
    }>;
  }) => {
    const query = `
      mutation UpdateMultipleGlobalVariables($input: UpdateMultipleGlobalVariablesInput!) {
        updateMultipleGlobalVariables(input: $input) {
          status
          reason
          data {
            successful
            failed {
              id
              reason
            }
          }
        }
      }
    `;
    const variables = { input };
    return { query, variables };
  },

  /**
   * Batch delete multiple global variables
   * Will only delete variables that are not in use
   */
  deleteMultipleGlobalVariables: (input: { ids: string[] }) => {
    const query = `
      mutation DeleteMultipleGlobalVariables($input: DeleteMultipleGlobalVariablesInput!) {
        deleteMultipleGlobalVariables(input: $input) {
          status
          reason
          data {
            successful
            failed {
              id
              reason
            }
          }
        }
      }
    `;
    const variables = { input };
    return { query, variables };
  },

  /**
   * Validate a global variable name for uniqueness
   * Used for real-time validation during form input
   */
  validateGlobalVariableName: (input: { name: string; excludeId?: string }) => {
    const query = `
      query ValidateGlobalVariableName($input: ValidateGlobalVariableNameInput!) {
        validateGlobalVariableName(input: $input) {
          status
          reason
          data {
            isValid
            suggestion
          }
        }
      }
    `;
    const variables = { input };
    return { query, variables };
  },

  /**
   * Get global variables usage statistics
   * Provides analytics data for dashboard display
   */
  getGlobalVariablesStats: () => {
    const query = `
      query GetGlobalVariablesStats {
        getGlobalVariablesStats {
          status
          reason
          data {
            totalVariables
            totalBotReferences
            variablesByType {
              type
              count
            }
            mostUsedVariables {
              id
              name
              botAmount
            }
            unusedVariables {
              id
              name
            }
          }
        }
      }
    `;
    return { query };
  },
};
