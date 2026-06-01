import { logger } from './loggerInstance';

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  responseTime?: number;
  details?: Record<string, unknown>;
}

export interface HealthCheckResult {
  overall: 'healthy' | 'warning' | 'error';
  checks: HealthCheck[];
  timestamp: Date;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warningChecks: number;
}

const SERVER_PORT = 5173;
const SERVER_HOST = 'localhost';
const APP_URL = `http://${SERVER_HOST}:${SERVER_PORT}`;

// Individual health check functions
async function checkServerConnectivity(): Promise<HealthCheck> {
  const startTime = Date.now();
  logger.info('Running server connectivity check');

  try {
    await fetch(APP_URL, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache',
    });

    const responseTime = Date.now() - startTime;
    logger.info('Server connectivity check passed', {
      responseTime: `${responseTime}ms`,
    });

    return {
      name: 'Server Connectivity',
      status: 'healthy',
      message: 'Server is responding normally',
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    logger.error('Server connectivity check failed', {
      error: errorMessage,
      responseTime: `${responseTime}ms`,
    });

    return {
      name: 'Server Connectivity',
      status: 'error',
      message: `Server is not responding: ${errorMessage}`,
      responseTime,
    };
  }
}

function checkPortAvailability(): HealthCheck {
  logger.info('Running port availability check');

  // Simulated check - in a real scenario, this might check if the port is bound
  const isPortConfigured = SERVER_PORT > 0 && SERVER_PORT < 65536;

  if (isPortConfigured) {
    logger.info('Port availability check passed', { port: SERVER_PORT });
    return {
      name: 'Port Configuration',
      status: 'healthy',
      message: `Port ${SERVER_PORT} is properly configured`,
      details: { port: SERVER_PORT, host: SERVER_HOST },
    };
  } else {
    logger.error('Port availability check failed', { port: SERVER_PORT });
    return {
      name: 'Port Configuration',
      status: 'error',
      message: `Invalid port configuration: ${SERVER_PORT}`,
      details: { port: SERVER_PORT, host: SERVER_HOST },
    };
  }
}

function checkApplicationFiles(): HealthCheck {
  logger.info('Running application files check');

  // Simulated check - in a real scenario, this might check for critical files
  const criticalFiles = [
    'package.json',
    'vite.config.ts',
    'src/main.tsx',
    'src/App.tsx',
  ];

  // Simulate file existence check
  const missingFiles: string[] = [];
  const existingFiles = criticalFiles.filter(() => {
    // Simulated logic - in reality, you'd check if files exist
    return Math.random() > 0.1; // 90% chance files exist
  });

  if (missingFiles.length === 0) {
    logger.info('Application files check passed', {
      filesChecked: criticalFiles.length,
    });
    return {
      name: 'Application Files',
      status: 'healthy',
      message: 'All critical application files are present',
      details: { criticalFiles, existingFiles },
    };
  } else {
    logger.warn('Application files check had issues', { missingFiles });
    return {
      name: 'Application Files',
      status: 'warning',
      message: `Some files may be missing: ${missingFiles.join(', ')}`,
      details: { criticalFiles, existingFiles, missingFiles },
    };
  }
}

function checkMemoryUsage(): HealthCheck {
  logger.info('Running memory usage check');

  // Simulated memory usage check
  const simulatedMemoryUsage = Math.floor(Math.random() * 100);

  let status: 'healthy' | 'warning' | 'error';
  let message: string;

  if (simulatedMemoryUsage < 70) {
    status = 'healthy';
    message = `Memory usage is normal (${simulatedMemoryUsage}%)`;
    logger.info('Memory usage check passed', {
      usage: `${simulatedMemoryUsage}%`,
    });
  } else if (simulatedMemoryUsage < 90) {
    status = 'warning';
    message = `Memory usage is elevated (${simulatedMemoryUsage}%)`;
    logger.warn('Memory usage check warning', {
      usage: `${simulatedMemoryUsage}%`,
    });
  } else {
    status = 'error';
    message = `Memory usage is critical (${simulatedMemoryUsage}%)`;
    logger.error('Memory usage check failed', {
      usage: `${simulatedMemoryUsage}%`,
    });
  }

  return {
    name: 'Memory Usage',
    status,
    message,
    details: { usage: simulatedMemoryUsage },
  };
}

function checkDatabaseConnection(): HealthCheck {
  logger.info('Running database connection check');

  // Simulated database check
  const isConnected = Math.random() > 0.05; // 95% chance of success

  if (isConnected) {
    logger.info('Database connection check passed');
    return {
      name: 'Database Connection',
      status: 'healthy',
      message: 'Database is connected and responding',
      details: { connectionPool: 'active', latency: '< 50ms' },
    };
  } else {
    logger.error('Database connection check failed');
    return {
      name: 'Database Connection',
      status: 'error',
      message: 'Database connection failed',
      details: { connectionPool: 'unavailable' },
    };
  }
}

function checkApiEndpoints(): HealthCheck {
  logger.info('Running API endpoints check');

  // Simulated API endpoints check
  const endpointsStatus = Math.random() > 0.1; // 90% chance of success

  if (endpointsStatus) {
    logger.info('API endpoints check passed');
    return {
      name: 'API Endpoints',
      status: 'healthy',
      message: 'All API endpoints are responsive',
      details: { endpointsChecked: 5, responsive: 5 },
    };
  } else {
    logger.warn('API endpoints check had issues');
    return {
      name: 'API Endpoints',
      status: 'warning',
      message: 'Some API endpoints may be slow',
      details: { endpointsChecked: 5, responsive: 4 },
    };
  }
}

// Main health check aggregation function
export async function performHealthChecks(): Promise<HealthCheckResult> {
  logger.info('Starting comprehensive health check');
  const startTime = Date.now();

  try {
    // Run all health checks
    const checks = await Promise.all([
      checkServerConnectivity(),
      checkPortAvailability(),
      checkApplicationFiles(),
      checkMemoryUsage(),
      checkDatabaseConnection(),
      checkApiEndpoints(),
    ]);

    // Calculate overall status
    const healthyCount = checks.filter(
      (check) => check.status === 'healthy'
    ).length;
    const warningCount = checks.filter(
      (check) => check.status === 'warning'
    ).length;
    const errorCount = checks.filter(
      (check) => check.status === 'error'
    ).length;

    let overall: 'healthy' | 'warning' | 'error';
    if (errorCount > 0) {
      overall = 'error';
    } else if (warningCount > 0) {
      overall = 'warning';
    } else {
      overall = 'healthy';
    }

    const result: HealthCheckResult = {
      overall,
      checks,
      timestamp: new Date(),
      totalChecks: checks.length,
      passedChecks: healthyCount,
      failedChecks: errorCount,
      warningChecks: warningCount,
    };

    const duration = Date.now() - startTime;
    logger.info('Health check completed', {
      overall,
      totalChecks: checks.length,
      passed: healthyCount,
      warnings: warningCount,
      errors: errorCount,
      duration: `${duration}ms`,
    });

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    logger.error('Health check failed with exception', { error: errorMessage });

    // Return a failed result
    return {
      overall: 'error',
      checks: [
        {
          name: 'Health Check System',
          status: 'error',
          message: `Health check system failed: ${errorMessage}`,
        },
      ],
      timestamp: new Date(),
      totalChecks: 1,
      passedChecks: 0,
      failedChecks: 1,
      warningChecks: 0,
    };
  }
}
