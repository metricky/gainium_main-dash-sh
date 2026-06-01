import React, { useEffect, useState } from 'react';
import getLatestPrices from '../../helper/price';
import type { Prices } from '../../types';

interface PriceDisplayProps {
  symbol?: string;
  exchange?: string;
  className?: string;
}

/**
 * Example component demonstrating how to use the price service
 */
export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  symbol = 'BTCUSDT',
  exchange = 'binance',
  className = '',
}) => {
  const [prices, setPrices] = useState<Prices>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Method 1: Subscribe to price updates (recommended for real-time updates)
    const unsubscribe = getLatestPrices(
      (result) => {
        if (result.status === 'OK') {
          setPrices(result.data);
          setLoading(false);
          setError(null);
        } else {
          setError(result.reason || 'Failed to fetch prices');
          setLoading(false);
        }
      },
      false // loadUs - set to true to include Binance US exchange
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Find the specific price for the symbol and exchange
  const currentPrice = prices.find(
    (p) => p.symbol === symbol && p.exchange === exchange
  )?.price;

  // Example: Get BTC price from any available exchange
  const btcPrice = prices.find(
    (p) =>
      p.symbol === 'BTCUSDT' &&
      ['binance', 'bybit', 'okx'].includes(p.exchange || '')
  )?.price;

  // Example: Get ETH price
  const ethPrice = prices.find(
    (p) => p.symbol === 'ETHUSDT' && p.exchange === 'binance'
  )?.price;

  if (loading) {
    return (
      <div className={`p-md bg-gray-100 rounded-md ${className}`}>
        <p className="text-gray-600">Loading prices...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-md bg-red-100 rounded-md ${className}`}>
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className={`p-md bg-white rounded-md shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold mb-3">Latest Prices</h3>

      <div className="space-y-xs">
        <div className="flex justify-between">
          <span className="text-gray-600">
            {symbol} ({exchange}):
          </span>
          <span className="font-mono font-medium">
            ${currentPrice?.toFixed(2) || 'N/A'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">BTC/USDT:</span>
          <span className="font-mono font-medium">
            ${btcPrice?.toFixed(2) || 'N/A'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">ETH/USDT:</span>
          <span className="font-mono font-medium">
            ${ethPrice?.toFixed(2) || 'N/A'}
          </span>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        Total pairs loaded: {prices.length}
      </div>
    </div>
  );
};
