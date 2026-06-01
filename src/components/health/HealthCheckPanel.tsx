import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import React, { useCallback, useState } from 'react';
import {
  performHealthChecks,
  type HealthCheck,
  type HealthCheckResult,
} from '../../lib/healthChecks';
import { logger } from '../../lib/loggerInstance';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface HealthCheckPanelProps {
  className?: string;
}

export const HealthCheckPanel: React.FC<HealthCheckPanelProps> = ({
  className,
}) => {
  const [healthResult, setHealthResult] = useState<HealthCheckResult | null>(
    null
  );
  const [isRunning, setIsRunning] = useState(false);

  const runHealthChecks = useCallback(async () => {
    logger.info('Health check panel: Starting health checks');
    setIsRunning(true);

    try {
      const result = await performHealthChecks();
      setHealthResult(result);

      logger.info('Health check panel: Health checks completed', {
        overall: result.overall,
        totalChecks: result.totalChecks,
        passed: result.passedChecks,
        warnings: result.warningChecks,
        errors: result.failedChecks,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error('Health check panel: Health checks failed', {
        error: errorMessage,
      });
    } finally {
      setIsRunning(false);
    }
  }, []);

  React.useEffect(() => {
    logger.info(
      'HealthCheckPanel component mounted, running initial health checks'
    );
    runHealthChecks();
  }, [runHealthChecks]);

  const getStatusIcon = (status: HealthCheck['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getOverallStatusIcon = () => {
    if (isRunning) {
      return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
    }

    if (!healthResult) {
      return <Activity className="h-5 w-5 text-muted-foreground" />;
    }

    switch (healthResult.overall) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Activity className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getOverallStatusColor = () => {
    if (isRunning) {
      return 'border-accent/30 bg-accent/10';
    }

    if (!healthResult) {
      return 'border-border bg-muted';
    }

    switch (healthResult.overall) {
      case 'healthy':
        return 'border-success/30 bg-success/10';
      case 'warning':
        return 'border-primary/30 bg-primary/10';
      case 'error':
        return 'border-destructive/30 bg-destructive/10';
      default:
        return 'border-border bg-muted';
    }
  };

  const getOverallStatusText = () => {
    if (isRunning) {
      return 'Running health checks...';
    }

    if (!healthResult) {
      return 'No health check results available';
    }

    const { warningChecks, failedChecks, totalChecks } = healthResult;

    if (failedChecks > 0) {
      return `${failedChecks} critical issue${failedChecks > 1 ? 's' : ''} found`;
    } else if (warningChecks > 0) {
      return `${warningChecks} warning${warningChecks > 1 ? 's' : ''} detected`;
    } else {
      return `All ${totalChecks} checks passed`;
    }
  };

  return (
    <Card
      className={cn(
        'transition-colors duration-200',
        getOverallStatusColor(),
        className
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-xs">
            {getOverallStatusIcon()}
            Health Checks
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={runHealthChecks}
            disabled={isRunning}
            className="h-8"
          >
            <RefreshCw
              className={cn('h-3 w-3 mr-1', isRunning && 'animate-spin')}
            />
            {isRunning ? 'Running...' : 'Refresh'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-md">
          {/* Overall Status Summary */}
          <div className="text-sm">
            <p className="text-muted-foreground">{getOverallStatusText()}</p>
            {healthResult && (
              <p className="text-xs text-muted-foreground mt-1">
                Last checked: {healthResult.timestamp.toLocaleString()}
              </p>
            )}
          </div>

          {/* Individual Check Results */}
          {healthResult && (
            <div className="space-y-xs">
              <h4 className="text-sm font-medium text-foreground">
                Check Details
              </h4>
              <div className="space-y-xs">
                {healthResult.checks.map((check, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-xs p-xs rounded-md bg-background/50 border"
                  >
                    <div className="mt-0.5">{getStatusIcon(check.status)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">
                          {check.name}
                        </p>
                        {check.responseTime && (
                          <span className="text-xs text-muted-foreground">
                            {check.responseTime}ms
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {check.message}
                      </p>
                      {check.details &&
                        Object.keys(check.details).length > 0 && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            {Object.entries(check.details).map(
                              ([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span>{key}:</span>
                                  <span className="font-mono">
                                    {String(value)}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Statistics */}
          {healthResult && (
            <div className="pt-2 border-t">
              <div className="grid grid-cols-3 gap-xs text-center">
                <div className="text-xs">
                  <div className="font-medium text-success">
                    {healthResult.passedChecks}
                  </div>
                  <div className="text-muted-foreground">Passed</div>
                </div>
                <div className="text-xs">
                  <div className="font-medium text-warning">
                    {healthResult.warningChecks}
                  </div>
                  <div className="text-muted-foreground">Warnings</div>
                </div>
                <div className="text-xs">
                  <div className="font-medium text-destructive">
                    {healthResult.failedChecks}
                  </div>
                  <div className="text-muted-foreground">Failed</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
