import { useGraphQL } from '@/hooks/useGraphQL';
import { GraphQlQuery } from '@/lib/api';
import React, { useEffect, useState } from 'react';

interface FearGreedNavigationViewProps {
  widgetId: string;
  compact?: boolean;
}

interface FearGreedDataPoint {
  value?: number;
  value_classification: string;
  update_time?: string;
}

interface FearGreedResponse {
  status: string;
  reason: string | null;
  data: FearGreedDataPoint | FearGreedDataPoint[];
}

const FearGreedNavigationView: React.FC<FearGreedNavigationViewProps> = ({
  widgetId: _widgetId,
  compact: _compact,
}) => {
  const [fearGreedData, setFearGreedData] = useState<{
    value: number;
    classification: string;
  } | null>(null);

  const { data: fearAndGreedData } = useGraphQL<
    FearGreedResponse,
    { input: { period?: '30D' | '1Y' } | undefined }
  >('getLatestFearAndGreedIndex', GraphQlQuery.getLatestFearAndGreedIndex());

  // Helper functions (same as dashboard widget)
  const getValueFromClassification = (
    classification: string | undefined | null
  ): number => {
    if (!classification) return 50; // Default to neutral if undefined/null
    switch (classification.toLowerCase()) {
      case 'extreme fear':
        return 15;
      case 'fear':
        return 35;
      case 'neutral':
        return 50;
      case 'greed':
        return 65;
      case 'extreme greed':
        return 85;
      default:
        return 50;
    }
  };

  const getClassificationForValue = (value: number): string => {
    if (value <= 25) return 'Extreme Fear';
    if (value <= 45) return 'Fear';
    if (value <= 54) return 'Neutral';
    if (value <= 75) return 'Greed';
    return 'Extreme Greed';
  };

  useEffect(() => {
    if (!fearAndGreedData) {
      return;
    }
    if (fearAndGreedData.status !== 'OK') {
      console.error(
        'Error loading fear and greed data:',
        fearAndGreedData.reason
      );
      return;
    }
    if (fearAndGreedData.status === 'OK' && fearAndGreedData.data) {
      // Handle both single object and array responses, same as dashboard widget
      const responseData = fearAndGreedData.data;
      const dataArray = Array.isArray(responseData)
        ? responseData
        : [responseData];

      // Get the most recent data point (last element in the array)
      const currentDataPoint = dataArray[dataArray.length - 1];

      if (currentDataPoint) {
        const value =
          currentDataPoint.value ||
          getValueFromClassification(currentDataPoint.value_classification);
        const classification = getClassificationForValue(value);

        setFearGreedData({ value, classification });
      }
    }
  }, [fearAndGreedData]);

  const getGaugeColor = (value: number) => {
    if (value <= 25) return 'text-red-600'; // Extreme Fear
    if (value <= 45) return 'text-orange-500'; // Fear
    if (value <= 54) return 'text-yellow-500'; // Neutral
    if (value <= 75) return 'text-green-500'; // Greed
    return 'text-green-600'; // Extreme Greed
  };

  // Don't render anything if no data is available yet
  if (!fearGreedData) {
    return null;
  }

  return (
    <div className="flex flex-col gap-0 shrink-0 cursor-pointer hover:bg-accent/50 px-0.5 py-0 rounded transition-all duration-200 hover:scale-105 min-w-[70px]">
      <div className="flex items-center gap-1 justify-center">
        <span className="font-medium text-xs text-muted-foreground">
          F&G Index
        </span>
      </div>

      <div className="flex flex-col items-center gap-0">
        <div className="flex items-center justify-center gap-1 py-1">
          <div
            className={`text-xs font-bold ${getGaugeColor(fearGreedData.value)}`}
          >
            {fearGreedData.value}
          </div>
          <div
            className={`text-xs font-medium ${getGaugeColor(fearGreedData.value)}`}
          >
            {fearGreedData.classification}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FearGreedNavigationView;
