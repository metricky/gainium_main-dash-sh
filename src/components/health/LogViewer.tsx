import { cn } from '@/lib/utils';
import {
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { logger, type LogEntry } from '../../lib/loggerInstance';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible';
import { ScrollArea } from '../ui/scroll-area';

interface LogViewerProps {
  className?: string;
  maxLines?: number;
}

export const LogViewer: React.FC<LogViewerProps> = ({
  className,
  maxLines = 100,
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const refreshLogs = useCallback(() => {
    setIsRefreshing(true);
    logger.debug('Refreshing log viewer');

    setTimeout(() => {
      const allLogs = logger.getLogs();
      setLogs(allLogs.slice(-maxLines));
      setIsRefreshing(false);
      logger.debug('Log viewer refreshed', { logCount: allLogs.length });
    }, 500);
  }, [maxLines]);

  const clearLogs = async () => {
    await logger.clearLogs();
    setLogs([]);
    logger.info('Logs cleared from viewer');
  };

  const downloadLogs = () => {
    const logText = logs
      .map(
        (log) =>
          `[${log.timestamp}] ${log.level}: ${log.message}${log.data ? ` | ${JSON.stringify(log.data)}` : ''}`
      )
      .join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    logger.info('Logs downloaded', { logCount: logs.length });
  };

  const getLogLevelColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'ERROR':
        return 'text-destructive';
      case 'WARN':
        return 'text-primary';
      case 'INFO':
        return 'text-primary';
      case 'DEBUG':
        return 'text-muted-foreground';
      default:
        return 'text-foreground';
    }
  };

  useEffect(() => {
    // Initial load
    refreshLogs();

    // Auto-refresh every 5 seconds
    const interval = setInterval(refreshLogs, 5000);

    return () => clearInterval(interval);
  }, [maxLines, refreshLogs]);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      data-testid="logs-viewer"
    >
      <Card className={cn('col-span-1 md:col-span-2', className)}>
        <CollapsibleTrigger asChild>
          <CardHeader
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            data-testid="logs-header"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-xs">
                <CardTitle>View Logs</CardTitle>
                <span
                  className="text-sm text-muted-foreground"
                  data-testid="log-count"
                >
                  ({logs.length} entries)
                </span>
              </div>
              <div className="flex items-center gap-xs">
                <span className="text-sm text-muted-foreground">
                  {isOpen ? 'Click to collapse' : 'Click to expand'}
                </span>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" data-testid="chevron-up" />
                ) : (
                  <ChevronDown className="h-4 w-4" data-testid="chevron-down" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent data-testid="logs-content">
          <CardContent>
            <div className="flex justify-end gap-xs mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshLogs}
                disabled={isRefreshing}
                className="flex items-center gap-1"
              >
                <RefreshCw
                  className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
                />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadLogs}
                disabled={logs.length === 0}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearLogs}
                disabled={logs.length === 0}
                className="flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </Button>
            </div>
            <ScrollArea className="h-64 w-full rounded-md border p-md">
              {logs.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No logs available
                </div>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <div
                      key={`${log.timestamp}-${index}`}
                      className="font-mono text-xs border-b border-border/30 pb-1"
                    >
                      <span className="text-muted-foreground">
                        [{new Date(log.timestamp).toLocaleTimeString()}]
                      </span>
                      <span
                        className={cn(
                          'font-semibold ml-2',
                          getLogLevelColor(log.level)
                        )}
                      >
                        {log.level}:
                      </span>
                      <span className="ml-2">{log.message}</span>
                      {log.data ? (
                        <div className="ml-16 text-muted-foreground mt-1">
                          <pre>{JSON.stringify(log.data, null, 2)}</pre>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            <div className="mt-2 text-xs text-muted-foreground">
              Showing last {logs.length} entries (max {maxLines})
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
