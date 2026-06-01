import React, { useEffect, useState } from 'react';
import { Badge } from './badge';
import { Activity } from 'lucide-react';

interface LiveUpdateIndicatorProps {
  lastUpdateTime: Date | null;
  isConnected: boolean;
}

export const LiveUpdateIndicator: React.FC<LiveUpdateIndicatorProps> = ({
  lastUpdateTime,
  isConnected,
}) => {
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (lastUpdateTime) {
      setIsPulsing(true);
      timer = setTimeout(() => setIsPulsing(false), 2000);
    } else {
      setIsPulsing(false);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [lastUpdateTime]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Badge
        className={`flex items-center gap-1 border ${
          isConnected
            ? 'bg-success/10 text-success border-success/20'
            : 'bg-muted/30 text-muted-foreground border-muted'
        } ${isPulsing ? 'animate-pulse' : ''}`}
      >
        <Activity
          className={`w-3 h-3 ${isConnected ? 'text-success' : 'text-muted-foreground'}`}
        />
        {isConnected ? 'Live' : 'Offline'}
      </Badge>
      {lastUpdateTime && (
        <span className="text-xs text-muted-foreground">
          Last update: {formatTime(lastUpdateTime)}
        </span>
      )}
    </div>
  );
};
