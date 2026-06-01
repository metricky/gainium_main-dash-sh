import {
  Activity,
  Award,
  BarChart3,
  Calendar,
  Clock,
  DollarSign,
  PieChart,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import React from 'react';
import { Badge } from '../../ui/badge';
import { Card, CardContent } from '../../ui/card';
import {
  DetailDrawer,
  DetailDrawerBody,
  DetailDrawerContent,
  DetailDrawerDescription,
  DetailDrawerHeader,
  DetailDrawerTitle,
  DetailDrawerTrigger,
} from '../../ui/detail-drawer';
import type { Backtest } from './Backtests';

interface BacktestDetailDrawerProps {
  backtest: Backtest;
  children: React.ReactNode;
}

// Generate chart data from backtest results (commented out to avoid unused function warnings)
/*
const _generateChartDataFromBacktest = (backtest: Backtest) => {
  const data = [];
  const startValue = 10000; // Starting portfolio value
  const endValue = startValue + backtest.netProfit;
  const startDate = backtest.startDate;
  const endDate = backtest.endDate;
  
  // Calculate number of data points based on testing period
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
  const dataPoints = Math.min(Math.max(daysDiff, 10), 150); // Between 10 and 150 points
  
  // Generate realistic progression from start to end value
  for (let i = 0; i <= dataPoints; i++) {
    const progress = i / dataPoints;
    const date = new Date(startDate.getTime() + (progress * (endDate.getTime() - startDate.getTime())));
    
    // Create realistic curve with some volatility
    const baseProgress = progress;
    const volatility = Math.sin(progress * Math.PI * 4) * 0.1 * Math.random(); // Add some realistic fluctuation
    const adjustedProgress = Math.max(0, Math.min(1, baseProgress + volatility));
    
    // Calculate value with realistic drawdown simulation
    let value = startValue + (endValue - startValue) * adjustedProgress;
    
    // Simulate drawdowns based on maxDrawDown
    if (backtest.maxDrawDown > 0 && progress > 0.2 && progress < 0.8) {
      const drawdownFactor = Math.sin(progress * Math.PI * 2) * (backtest.maxDrawDown / 100) * 0.5;
      value *= (1 + drawdownFactor);
    }
    
    const profit = value - startValue;
    data.push({ 
      date, 
      value: Math.round(value * 100) / 100, 
      profit: Math.round(profit * 100) / 100 
    });
  }
  
  return data;
};

// Generate realistic chart data from backtest results
const generateRealisticChartData = (backtest: Backtest) => {
  const data = [];
  const startValue = 10000; // Starting portfolio value
  const endValue = startValue + backtest.netProfit;
  const startDate = backtest.startDate;
  const endDate = backtest.endDate;
  
  const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));
  // const _dailyReturn = totalDays > 1 ? Math.pow(endValue / startValue, 1 / totalDays) - 1 : 0;
  
  let currentValue = startValue;
  
  for (let i = 0; i <= totalDays; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    
    // Add some realistic volatility while trending toward the final result
    const progress = i / totalDays;
    const targetValue = startValue + (backtest.netProfit * progress);
    const volatility = (Math.random() - 0.5) * 0.02; // ±1% daily volatility
    
    if (i === 0) {
      currentValue = startValue;
    } else if (i === totalDays) {
      currentValue = endValue; // Ensure we end at the exact final value
    } else {
      // Blend between current trend and target with some volatility
      currentValue = targetValue * (1 + volatility);
    }
    
    data.push({
      date,
      value: Math.round(currentValue * 100) / 100,
      profit: Math.round((currentValue - startValue) * 100) / 100,
    });
  }

  return data;
};
*/

const BacktestPerformanceChart: React.FC<{
  data: Array<{ date: Date; value: number; profit: number }>;
}> = ({ data }) => {
  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const range = maxValue - minValue;

  const pathData = data
    .map((point, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((point.value - minValue) / range) * 100;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  const isProfit = data[data.length - 1].profit > 0;

  return (
    <div className="h-64 w-full relative bg-muted/20 rounded-lg p-md">
      <div className="absolute inset-4">
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          <defs>
            <pattern
              id="grid"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.1"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />

          {/* Performance line */}
          <path
            d={pathData}
            fill="none"
            stroke={isProfit ? '#10b981' : '#ef4444'}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />

          {/* Gradient fill */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop
                offset="0%"
                stopColor={isProfit ? '#10b981' : '#ef4444'}
                stopOpacity="0.2"
              />
              <stop
                offset="100%"
                stopColor={isProfit ? '#10b981' : '#ef4444'}
                stopOpacity="0"
              />
            </linearGradient>
          </defs>
          <path d={`${pathData} L 100 100 L 0 100 Z`} fill="url(#gradient)" />
        </svg>
      </div>

      {/* Chart labels */}
      <div className="absolute bottom-2 left-4 text-xs text-muted-foreground">
        {data[0].date.toLocaleDateString()}
      </div>
      <div className="absolute bottom-2 right-4 text-xs text-muted-foreground">
        {data[data.length - 1].date.toLocaleDateString()}
      </div>
      <div className="absolute top-2 left-4 text-xs text-muted-foreground">
        ${maxValue.toLocaleString()}
      </div>
      <div className="absolute bottom-8 left-4 text-xs text-muted-foreground">
        ${minValue.toLocaleString()}
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'green' | 'red' | 'blue' | 'orange' | 'purple';
}> = ({ title, value, icon, trend, color = 'blue' }) => {
  const colorClasses = {
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400',
    blue: 'text-blue-600 dark:text-blue-400',
    orange: 'text-orange-600 dark:text-orange-400',
    purple: 'text-purple-600 dark:text-purple-400',
  };

  const bgColorClasses = {
    green: 'bg-green-100 dark:bg-green-900/20',
    red: 'bg-red-100 dark:bg-red-900/20',
    blue: 'bg-blue-100 dark:bg-blue-900/20',
    orange: 'bg-orange-100 dark:bg-orange-900/20',
    purple: 'bg-purple-100 dark:bg-purple-900/20',
  };

  return (
    <Card className="h-full">
      <CardContent className="p-md">
        <div className="flex items-center justify-between mb-2">
          <div className={`p-xs rounded-lg ${bgColorClasses[color]}`}>
            <div className={colorClasses[color]}>{icon}</div>
          </div>
          {trend && (
            <div
              className={`flex items-center ${
                trend === 'up'
                  ? 'text-green-600 dark:text-green-400'
                  : trend === 'down'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-muted-foreground'
              }`}
            >
              {trend === 'up' ? (
                <TrendingUp className="h-4 w-4" />
              ) : trend === 'down' ? (
                <TrendingDown className="h-4 w-4" />
              ) : null}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export const BacktestDetailDrawer: React.FC<BacktestDetailDrawerProps> = ({
  backtest,
  children,
}) => {
  const chartData = React.useMemo(() => {
    // Generate realistic chart data from backtest results
    const data = [];
    const startValue = 10000; // Starting portfolio value
    const endValue = startValue + backtest.netProfit;
    const startDate = backtest.startDate;
    const endDate = backtest.endDate;

    const totalDays = Math.max(
      1,
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
      )
    );

    let currentValue = startValue;

    for (let i = 0; i <= totalDays; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);

      // Add some realistic volatility while trending toward the final result
      const progress = i / totalDays;
      const targetValue = startValue + backtest.netProfit * progress;
      const volatility = (Math.random() - 0.5) * 0.02; // ±1% daily volatility

      if (i === 0) {
        currentValue = startValue;
      } else if (i === totalDays) {
        currentValue = endValue; // Ensure we end at the exact final value
      } else {
        // Blend between current trend and target with some volatility
        currentValue = targetValue * (1 + volatility);
      }

      data.push({
        date,
        value: Math.round(currentValue * 100) / 100,
        profit: Math.round((currentValue - startValue) * 100) / 100,
      });
    }

    return data;
  }, [backtest]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <DetailDrawer>
      <DetailDrawerTrigger asChild>{children}</DetailDrawerTrigger>

      <DetailDrawerContent width="2xl">
        <DetailDrawerHeader>
          <DetailDrawerTitle>
            Backtest Details: {backtest.name}
          </DetailDrawerTitle>
          <DetailDrawerDescription>
            {backtest.strategy} strategy on {backtest.pair} •{' '}
            {backtest.testingPeriodName}
          </DetailDrawerDescription>

          <div className="flex gap-xs mt-4">
            <Badge variant={backtest.serverSide ? 'default' : 'secondary'}>
              {backtest.serverSide ? 'Server Side' : 'Client Side'}
            </Badge>
            <Badge variant={backtest.savePermanently ? 'default' : 'outline'}>
              {backtest.savePermanently ? 'Saved Permanently' : 'Temporary'}
            </Badge>
            <Badge variant="outline">{backtest.interval}</Badge>
          </div>
        </DetailDrawerHeader>

        <DetailDrawerBody>
          <div className="space-y-lg">
            {/* Performance Chart */}
            <div className="space-y-sm">
              <h3 className="text-lg font-semibold flex items-center gap-xs">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Portfolio Performance
              </h3>
              <BacktestPerformanceChart data={chartData} />
            </div>

            {/* Key Metrics Grid */}
            <div className="space-y-sm">
              <h3 className="text-lg font-semibold flex items-center gap-xs">
                <Activity className="h-5 w-5 text-purple-600" />
                Key Performance Metrics
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-md">
                <StatCard
                  title="Net Profit"
                  value={formatPercentage(backtest.netProfit)}
                  icon={<DollarSign className="h-5 w-5" />}
                  trend={backtest.netProfit > 0 ? 'up' : 'down'}
                  color={backtest.netProfit > 0 ? 'green' : 'red'}
                />
                <StatCard
                  title="Annualized Return"
                  value={formatPercentage(backtest.annualizedReturn)}
                  icon={<TrendingUp className="h-5 w-5" />}
                  trend={backtest.annualizedReturn > 0 ? 'up' : 'down'}
                  color={backtest.annualizedReturn > 0 ? 'green' : 'red'}
                />
                <StatCard
                  title="Max Drawdown"
                  value={formatPercentage(backtest.maxDrawDown)}
                  icon={<TrendingDown className="h-5 w-5" />}
                  color="red"
                />
                <StatCard
                  title="Sharpe Ratio"
                  value={backtest.sharpeRatio.toFixed(2)}
                  icon={<Target className="h-5 w-5" />}
                  color="blue"
                />
                <StatCard
                  title="Profit Factor"
                  value={backtest.profitFactor.toFixed(2)}
                  icon={<Award className="h-5 w-5" />}
                  color={backtest.profitFactor > 1 ? 'green' : 'red'}
                />
                <StatCard
                  title="Total Deals"
                  value={backtest.deals.toLocaleString()}
                  icon={<PieChart className="h-5 w-5" />}
                  color="purple"
                />
              </div>
            </div>

            {/* Trading Details */}
            <div className="space-y-sm">
              <h3 className="text-lg font-semibold flex items-center gap-xs">
                <Clock className="h-5 w-5 text-orange-600" />
                Trading Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <Card>
                  <CardContent className="p-md space-y-sm">
                    <h4 className="font-medium">Period Information</h4>
                    <div className="space-y-xs text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Start Date:
                        </span>
                        <span>{backtest.startDate.toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">End Date:</span>
                        <span>{backtest.endDate.toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Testing Period:
                        </span>
                        <span>{backtest.testingPeriod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Bot Working Time:
                        </span>
                        <span>{backtest.botWorkingTime}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-md space-y-sm">
                    <h4 className="font-medium">Strategy Details</h4>
                    <div className="space-y-xs text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Strategy:</span>
                        <span>{backtest.strategy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Start Condition:
                        </span>
                        <span className="text-right max-w-[200px] truncate">
                          {backtest.startCondition}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Interval:</span>
                        <span>{backtest.interval}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Price Deviation:
                        </span>
                        <span>
                          {formatPercentage(backtest.actualPriceDeviation)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Advanced Metrics */}
            <div className="space-y-sm">
              <h3 className="text-lg font-semibold flex items-center gap-xs">
                <Calendar className="h-5 w-5 text-green-600" />
                Advanced Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
                <Card>
                  <CardContent className="p-md">
                    <div className="space-y-xs">
                      <p className="text-sm text-muted-foreground">
                        Avg Net Daily
                      </p>
                      <p className="text-xl font-bold">
                        {formatCurrency(backtest.avgNetDaily)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-md">
                    <div className="space-y-xs">
                      <p className="text-sm text-muted-foreground">
                        Deals Per Day
                      </p>
                      <p className="text-xl font-bold">
                        {backtest.dealsPerDay.toFixed(1)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-md">
                    <div className="space-y-xs">
                      <p className="text-sm text-muted-foreground">
                        Avg DCA Orders
                      </p>
                      <p className="text-xl font-bold">
                        {backtest.avgDCAOrdersTriggered.toFixed(1)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-md">
                    <div className="space-y-xs">
                      <p className="text-sm text-muted-foreground">
                        Buy & Hold Return
                      </p>
                      <p className="text-xl font-bold">
                        {formatPercentage(backtest.buyAndHoldReturn)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-md">
                    <div className="space-y-xs">
                      <p className="text-sm text-muted-foreground">
                        Sortino Ratio
                      </p>
                      <p className="text-xl font-bold">
                        {backtest.sortinoRatio.toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-md">
                    <div className="space-y-xs">
                      <p className="text-sm text-muted-foreground">CWR</p>
                      <p className="text-xl font-bold">
                        {backtest.cwr.toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Notes Section */}
            {backtest.notes && (
              <div className="space-y-sm">
                <h3 className="text-lg font-semibold">Notes</h3>
                <Card>
                  <CardContent className="p-md">
                    <p className="text-sm text-muted-foreground">
                      {backtest.notes}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </DetailDrawerBody>
      </DetailDrawerContent>
    </DetailDrawer>
  );
};
