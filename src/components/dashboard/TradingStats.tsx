import { CHART_COLORS } from '@/lib/colors';
import {
  Activity,
  BarChart3,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  chart?: React.ReactNode;
  showTimeButtons?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  trend,
  icon,
  chart,
  showTimeButtons = false,
}) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-success';
      case 'down':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />;
      case 'down':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const timeButtons = ['1d', '3d', '1w', '1m', '3m', '1y'];

  return (
    <Card className="h-fit">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">{value}</div>
            {change && (
              <div
                className={`flex items-center gap-1 text-xs ${getTrendColor()}`}
              >
                {getTrendIcon()}
                <span>{change}</span>
              </div>
            )}
          </div>
        </div>
        {chart && (
          <div className="mt-4">
            <div className="h-20">{chart}</div>
            {showTimeButtons && (
              <div className="flex items-center justify-center gap-1 mt-3">
                {timeButtons.map((period, index) => (
                  <button
                    key={period}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      index === 3 // 1m is selected by default
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Simple chart components for mockup
const MiniLineChart: React.FC<{ color?: string }> = ({
  color = CHART_COLORS.orange,
}) => (
  <div className="relative h-full w-full">
    <svg viewBox="0 0 300 80" className="h-full w-full">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.3 }} />
          <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.1 }} />
        </linearGradient>
      </defs>
      <path
        d="M0,60 L50,45 L100,30 L150,35 L200,25 L250,20 L300,15"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M0,60 L50,45 L100,30 L150,35 L200,25 L250,20 L300,15 L300,80 L0,80 Z"
        fill="url(#gradient)"
      />
    </svg>
  </div>
);

const MiniBarChart: React.FC<{ color?: string }> = ({
  color = CHART_COLORS.red,
}) => (
  <div className="relative h-full w-full flex items-end justify-center gap-1">
    {[45, 60, 30, 80, 35, 70, 25, 55, 40, 65].map((height, index) => (
      <div
        key={index}
        className="w-4 rounded-t"
        style={{
          height: `${height}%`,
          backgroundColor: color,
          opacity: 0.8,
        }}
      />
    ))}
  </div>
);

const TradingStats: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md mb-6">
      <StatCard
        title="Closed Trades"
        value="134"
        change="+12 this week"
        trend="up"
        icon={<Activity className="h-4 w-4" />}
      />

      <StatCard
        title="Profit"
        value="$-854.66"
        change="-2.3% this month"
        trend="down"
        icon={<DollarSign className="h-4 w-4" />}
      />

      <StatCard
        title="Accumulated Profit"
        value="$2,847.32"
        change="+18.2% this month"
        trend="up"
        icon={<TrendingUp className="h-4 w-4" />}
        chart={<MiniLineChart color={CHART_COLORS.green} />}
        showTimeButtons={true}
      />

      <StatCard
        title="Profit By Day"
        value="$127.45"
        change="Today's performance"
        trend="neutral"
        icon={<BarChart3 className="h-4 w-4" />}
        chart={<MiniBarChart color={CHART_COLORS.coral} />}
        showTimeButtons={true}
      />
    </div>
  );
};

export default TradingStats;
