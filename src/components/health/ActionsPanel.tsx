import { cn } from '@/lib/utils';
import { AlertTriangle, Power, PowerOff, RefreshCw } from 'lucide-react';
import React, { useState } from 'react';
import { logger } from '../../lib/loggerInstance';
import { useServerStatusActions } from '../../stores/serverStatus';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface ActionsPanelProps {
  className?: string;
}

export const ActionsPanel: React.FC<ActionsPanelProps> = ({ className }) => {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { checkServerStatus } = useServerStatusActions();

  const handleAction = async (action: string) => {
    logger.info('Health action triggered', { action });
    setIsLoading(action);

    try {
      if (action === 'refresh') {
        // Use the shared server status store for refresh
        await checkServerStatus();
        logger.info('Server status refresh completed');
      } else {
        // Simulate other API calls
        await new Promise((resolve) => setTimeout(resolve, 2000));
        logger.info('Health action completed', { action });
      }
    } catch (error) {
      logger.error('Health action failed', { action, error });
    } finally {
      setIsLoading(null);
    }
  };

  const actions = [
    {
      id: 'refresh',
      label: 'Refresh Status',
      icon: RefreshCw,
      variant: 'outline' as const,
      description: 'Check current server status',
    },
    {
      id: 'restart',
      label: 'Restart Server',
      icon: Power,
      variant: 'default' as const,
      description: 'Restart the server process',
    },
    {
      id: 'stop',
      label: 'Stop Server',
      icon: PowerOff,
      variant: 'destructive' as const,
      description: 'Stop the server process',
    },
    {
      id: 'clearLogs',
      label: 'Clear Logs',
      icon: AlertTriangle,
      variant: 'secondary' as const,
      description: 'Clear all log entries',
    },
  ];

  return (
    <Card className={cn('col-span-1 md:col-span-2', className)}>
      <CardHeader>
        <CardTitle>Server Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-sm">
          {actions.map((action) => {
            const Icon = action.icon;
            const isCurrentlyLoading = isLoading === action.id;

            return (
              <div key={action.id} className="space-y-xs">
                <Button
                  variant={action.variant}
                  onClick={() => handleAction(action.id)}
                  disabled={isLoading !== null}
                  className="w-full flex items-center gap-xs"
                >
                  <Icon
                    className={cn(
                      'h-4 w-4',
                      isCurrentlyLoading && 'animate-spin'
                    )}
                  />
                  {action.label}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  {action.description}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
