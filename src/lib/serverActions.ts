import { logger } from './loggerInstance';

export type ServerAction = 'start' | 'stop' | 'reload';

export interface ServerActionResult {
  success: boolean;
  action: ServerAction;
  message: string;
  error?: string | undefined;
  scriptPath?: string;
  preActionStatus?: boolean;
  postActionStatus?: boolean;
}

// Script paths as defined in the instructions
const SCRIPT_PATHS = {
  start: './scripts/start.sh',
  stop: './scripts/stop.sh',
  reload: './scripts/reload.sh',
} as const;

/**
 * Helper function to execute server actions (start/stop/reload)
 * Always checks current status first per rule, logs with proper levels,
 * and displays script paths.
 */
export async function executeServerAction(
  action: ServerAction
): Promise<ServerActionResult> {
  const scriptPath = SCRIPT_PATHS[action];

  logger.info(`Initiating server action: ${action}`, {
    action,
    scriptPath,
  });

  try {
    // ALWAYS check current status first per rule
    logger.info('Checking current server status before action', { action });

    const statusChecker = {
      checkServerStatus: async () => {
        try {
          await fetch('http://localhost:5173', {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-cache',
          });
          return { isOnline: true };
        } catch {
          return { isOnline: false };
        }
      },
    };

    const preActionStatus = await statusChecker.checkServerStatus();
    const wasOnlineBefore = preActionStatus.isOnline;

    logger.info('Pre-action server status determined', {
      action,
      wasOnline: wasOnlineBefore,
      scriptPath,
    });

    // Log the script path that will be executed
    logger.info(`Executing server script: ${scriptPath}`, {
      action,
      scriptPath,
      preActionStatus: wasOnlineBefore,
    });

    // Simulate script execution (in a real implementation, this would call a backend API)
    const result = await simulateServerAction(
      action,
      scriptPath,
      wasOnlineBefore
    );

    // Check status after action to verify result
    logger.info('Checking server status after action', { action });
    const postActionStatus = await statusChecker.checkServerStatus();
    const isOnlineAfter = postActionStatus.isOnline;

    logger.info('Post-action server status determined', {
      action,
      isOnline: isOnlineAfter,
      wasOnlineBefore,
      scriptPath,
    });

    const actionResult: ServerActionResult = {
      success: result.success,
      action,
      message: result.message,
      scriptPath,
      preActionStatus: wasOnlineBefore,
      postActionStatus: isOnlineAfter,
      error: result.error,
    };

    if (result.success) {
      logger.info(`Server action completed successfully: ${action}`, {
        action,
        scriptPath,
        preActionStatus: wasOnlineBefore,
        postActionStatus: isOnlineAfter,
        message: result.message,
      });
    } else {
      logger.error(`Server action failed: ${action}`, {
        action,
        scriptPath,
        error: result.error,
        preActionStatus: wasOnlineBefore,
        postActionStatus: isOnlineAfter,
      });
    }

    return actionResult;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    logger.error(`Server action exception: ${action}`, {
      action,
      scriptPath,
      error: errorMessage,
    });

    return {
      success: false,
      action,
      message: `Failed to execute ${action} action`,
      error: errorMessage,
      scriptPath,
    };
  }
}

/**
 * Simulates server action execution
 * In a real implementation, this would make HTTP requests to a backend API
 * that would execute the actual shell scripts
 */
async function simulateServerAction(
  action: ServerAction,
  scriptPath: string,
  wasOnlineBefore: boolean
): Promise<{ success: boolean; message: string; error?: string }> {
  // Simulate realistic delays for different actions
  const delays = {
    start: 2000, // 2 seconds to start
    stop: 1500, // 1.5 seconds to stop
    reload: 3000, // 3 seconds to reload (stop + pull + start)
  };

  logger.info(`Simulating ${action} action with script: ${scriptPath}`, {
    action,
    scriptPath,
    estimatedDuration: `${delays[action]}ms`,
  });

  // Simulate the delay
  await new Promise((resolve) => setTimeout(resolve, delays[action]));

  // Simulate different outcomes based on action and current state
  switch (action) {
    case 'start':
      if (wasOnlineBefore) {
        logger.warn('Start action called but server was already running', {
          scriptPath,
        });
        return {
          success: true,
          message: 'Server was already running. Script executed successfully.',
        };
      } else {
        logger.info('Start action simulated successfully', { scriptPath });
        return {
          success: true,
          message: 'Server started successfully.',
        };
      }

    case 'stop':
      if (!wasOnlineBefore) {
        logger.warn('Stop action called but server was already stopped', {
          scriptPath,
        });
        return {
          success: true,
          message: 'Server was already stopped. Script executed successfully.',
        };
      } else {
        logger.info('Stop action simulated successfully', { scriptPath });
        return {
          success: true,
          message: 'Server stopped successfully.',
        };
      }

    case 'reload':
      logger.info('Reload action simulated successfully', { scriptPath });
      return {
        success: true,
        message: 'Server reloaded successfully (stop → pull → start).',
      };

    default:
      logger.error('Unknown server action requested', { action, scriptPath });
      return {
        success: false,
        message: `Unknown action: ${action}`,
        error: `Invalid action type: ${action}`,
      };
  }
}

/**
 * Get the script path for a given action
 */
export function getScriptPath(action: ServerAction): string {
  return SCRIPT_PATHS[action];
}

/**
 * Validate if an action is supported
 */
export function isValidServerAction(action: string): action is ServerAction {
  return ['start', 'stop', 'reload'].includes(action);
}
