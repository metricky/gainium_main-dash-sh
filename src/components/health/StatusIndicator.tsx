import { cn } from '@/lib/utils';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import React from 'react';
import { useServerStatusPolling } from '../../hooks/useServerStatusPolling';
import { logger } from '../../lib/loggerInstance';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface StatusIndicatorProps {
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  className,
}) => {
  const { isOnline, lastChecked, isChecking, error, responseTime } =
    useServerStatusPolling();

  React.useEffect(() => {
    logger.info(
      'StatusIndicator component mounted with shared server status store'
    );
  }, []);

  React.useEffect(() => {
    logger.info('Server status updated in StatusIndicator', {
      isOnline,
      lastChecked: lastChecked.toISOString(),
      responseTime: responseTime ? `${responseTime}ms` : 'N/A',
      error,
    });
  }, [isOnline, lastChecked, responseTime, error]);

  const getStatusIcon = () => {
    if (isChecking) {
      return (
        <Loader2 className="h-6 w-6 text-gradient-start dark:text-gradient-end animate-spin" />
      );
    }

    if (isOnline) {
      return <CheckCircle className="h-6 w-6 text-success" />;
    } else {
      return <XCircle className="h-6 w-6 text-destructive" />;
    }
  };

  const getStatusText = () => {
    if (isChecking) {
      return 'Checking server status...';
    }

    if (isOnline) {
      return 'Server is online and responding';
    } else {
      return error ? `Server offline: ${error}` : 'Server is offline';
    }
  };

  const getStatusColor = () => {
    if (isChecking) {
      return 'border-accent/30 bg-accent/10';
    }

    if (isOnline) {
      return 'border-success/30 bg-success/10';
    } else {
      return 'border-destructive/30 bg-destructive/10';
    }
  };

  return (
    <Card
      className={cn(
        'transition-colors duration-200',
        getStatusColor(),
        className
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-xs">
          {getStatusIcon()}
          Server Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{getStatusText()}</p>
        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
          <div>Last checked: {lastChecked.toLocaleTimeString()}</div>
          {responseTime && <div>Response time: {responseTime}ms</div>}
        </div>
      </CardContent>
    </Card>
  );
};
