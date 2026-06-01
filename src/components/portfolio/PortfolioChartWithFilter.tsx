import { CHART_COLORS } from '@/lib/colors';
import React, { useState } from 'react';
import { CoinFilter } from '../widgets/shared/CoinSelect';

// Mock data for the chart (matching PortfolioValue format)
const chartData = [
  {
    date: '4PM',
    value: 99621.44,
    time: '16:00',
    USDT: 12500.0,
    BTC: 45200.5,
    ETH: 18400.2,
    BNB: 8900.1,
    ADA: 2100.8,
    SOL: 12520.85,
  },
  {
    date: '9PM',
    value: 99520.57,
    time: '21:00',
    USDT: 12480.0,
    BTC: 44800.3,
    ETH: 18200.5,
    BNB: 8950.2,
    ADA: 2180.4,
    SOL: 12909.07,
  },
  {
    date: '2AM',
    value: 99419.71,
    time: '02:00',
    USDT: 12450.0,
    BTC: 44500.8,
    ETH: 17900.1,
    BNB: 9100.5,
    ADA: 2250.6,
    SOL: 13213.61,
  },
  {
    date: '7AM',
    value: 99318.84,
    time: '07:00',
    USDT: 12420.0,
    BTC: 44200.2,
    ETH: 17650.8,
    BNB: 9200.3,
    ADA: 2320.1,
    SOL: 13525.54,
  },
  {
    date: '12PM',
    value: 99415.22,
    time: '12:00',
    USDT: 12465.0,
    BTC: 44350.7,
    ETH: 17750.4,
    BNB: 9150.8,
    ADA: 2280.3,
    SOL: 13418.92,
  },
];

export const PortfolioChartWithFilter: React.FC = () => {
  const [selectedCoins, setSelectedCoins] = useState(['ALL']);

  // Coin management functions
  const handleCoinToggle = (coinSymbol: string) => {
    if (coinSymbol === 'ALL') {
      // If ALL is being toggled off and it's the only selection, don't allow it
      if (selectedCoins.includes('ALL') && selectedCoins.length === 1) {
        return; // Prevent removing ALL if it's the only option
      }
    }

    if (selectedCoins.includes(coinSymbol)) {
      const newSelectedCoins = selectedCoins.filter((c) => c !== coinSymbol);
      // If toggling off this coin would result in an empty array, automatically select "ALL"
      if (newSelectedCoins.length === 0) {
        setSelectedCoins(['ALL']);
      } else {
        setSelectedCoins(newSelectedCoins);
      }
    } else {
      setSelectedCoins([...selectedCoins, coinSymbol]);
    }
  };

  const handleRemoveCoin = (coinSymbol: string) => {
    // Special handling for "ALL" option
    if (coinSymbol === 'ALL' && selectedCoins.length === 1) {
      return; // Prevent removing ALL if it's the only option
    }

    const newSelectedCoins = selectedCoins.filter((c) => c !== coinSymbol);
    // If removing this coin would result in an empty array, automatically select "ALL"
    if (newSelectedCoins.length === 0) {
      setSelectedCoins(['ALL']);
    } else {
      setSelectedCoins(newSelectedCoins);
    }
  };

  // Calculate min and max values for scaling
  const btcValues = chartData.map((d) => d.BTC);
  const usdValues = chartData.map((d) => d.USDT);
  const minBtc = Math.min(...btcValues);
  const maxBtc = Math.max(...btcValues);
  const minUsd = Math.min(...usdValues);
  const maxUsd = Math.max(...usdValues);

  // Create SVG path for BTC line
  const btcPath = chartData
    .map((point, index) => {
      const x = (index / (chartData.length - 1)) * 100;
      const y = 100 - ((point.BTC - minBtc) / (maxBtc - minBtc)) * 80;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Create SVG path for USD line
  const usdPath = chartData
    .map((point, index) => {
      const x = (index / (chartData.length - 1)) * 100;
      const y = 100 - ((point.USDT - minUsd) / (maxUsd - minUsd)) * 80;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <div className="space-y-md">
      {/* Chart */}
      <div className="bg-inner-box-bg p-md rounded-xl">
        <div className="h-80 w-full relative">
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
                  strokeWidth="0.1"
                  className="text-muted-foreground/20"
                />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />

            {/* BTC Line */}
            <path
              d={btcPath}
              fill="none"
              stroke={CHART_COLORS.primary}
              strokeWidth="0.5"
              vectorEffect="non-scaling-stroke"
            />

            {/* USD Line */}
            <path
              d={usdPath}
              fill="none"
              stroke={CHART_COLORS.secondary}
              strokeWidth="0.5"
              vectorEffect="non-scaling-stroke"
              strokeDasharray="2,2"
            />
          </svg>

          {/* Legend */}
          <div className="absolute top-4 right-4 flex items-center gap-md bg-background/80 backdrop-blur-sm rounded px-3 py-2">
            <div className="flex items-center gap-xs">
              <div
                className="w-3 h-0.5"
                style={{ backgroundColor: CHART_COLORS.primary }}
              ></div>
              <span className="text-sm text-muted-foreground">BTC</span>
            </div>
            <div className="flex items-center gap-xs">
              <div
                className="w-3 h-0.5 border-dashed border-t-2"
                style={{ borderColor: CHART_COLORS.secondary }}
              ></div>
              <span className="text-sm text-muted-foreground">USD</span>
            </div>
          </div>
        </div>
      </div>

      {/* Coin Filter */}
      <CoinFilter
        selectedCoins={selectedCoins}
        onCoinToggle={handleCoinToggle}
        onRemoveCoin={handleRemoveCoin}
      />
    </div>
  );
};
