import { Bot, Settings, TrendingUp } from 'lucide-react';
import React from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface BotData {
  id: string;
  name: string;
  type: 'signal' | 'grid' | 'dca' | 'combo';
  exchange: string;
  symbol: string;
  profit: number;
  profitUsd: number;
  pnlPercent: number;
  invested: number;
  investedUsd: number;
  runtime: string;
  status: 'active' | 'paused' | 'stopped' | 'error';
}

interface BotDetailsPanelProps {
  bot: BotData;
}

export const BotDetailsPanel: React.FC<BotDetailsPanelProps> = ({ bot }) => {
  const getStatusColor = (status: BotData['status']) => {
    switch (status) {
      case 'active':
        return 'text-success';
      case 'paused':
        return 'text-warning';
      case 'stopped':
        return 'text-muted-foreground';
      case 'error':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getTypeIcon = (type: BotData['type']) => {
    switch (type) {
      case 'signal':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <Bot className="w-5 h-5" />;
    }
  };

  return (
    <Card className="p-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-sm">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            {getTypeIcon(bot.type)}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{bot.name}</h2>
            <p className="text-muted-foreground">
              {bot.exchange} • {bot.symbol} • {bot.type}
            </p>
          </div>
          <div className={`ml-4 font-medium ${getStatusColor(bot.status)}`}>
            {bot.status.charAt(0).toUpperCase() + bot.status.slice(1)}
          </div>
        </div>
        <div className="flex items-center gap-xs">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" size="sm">
            Stop
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-lg">
        <div className="text-center p-md bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold text-success">
            {(bot.profit / 100000000).toFixed(8)}
          </div>
          <div className="text-sm text-muted-foreground mb-1">
            ${bot.profitUsd.toFixed(2)} USD
          </div>
          <div className="text-xs font-medium text-muted-foreground">PnL</div>
        </div>

        <div className="text-center p-md bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold">
            {(bot.invested / 100000000).toFixed(8)}
          </div>
          <div className="text-sm text-muted-foreground mb-1">
            ${bot.investedUsd.toFixed(2)} USD
          </div>
          <div className="text-xs font-medium text-muted-foreground">
            Invested ({bot.symbol})
          </div>
        </div>

        <div className="text-center p-md bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold text-success">
            {bot.pnlPercent.toFixed(2)}%
          </div>
          <div className="text-xs font-medium text-muted-foreground">PnL %</div>
        </div>

        <div className="text-center p-md bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold">{bot.runtime}</div>
          <div className="text-xs font-medium text-muted-foreground">
            Runtime
          </div>
        </div>
      </div>
    </Card>
  );
};
