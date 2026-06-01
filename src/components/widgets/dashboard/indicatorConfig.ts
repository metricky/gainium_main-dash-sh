// Shared indicator configuration helper extracted from IndicatorHeatmapBase.
export interface IndicatorCategoryConfig {
  label: string;
  color: string;
  bgColor: string;
  key: string;
}

export interface IndicatorConfiguration {
  name: string;
  title: string;
  unit: string;
  categories: IndicatorCategoryConfig[];
  getColor: (value: number) => string;
  getLabel: (value: number) => string;
  getCategoryPercentages: (values: number[]) => { [key: string]: number };
}

export const getIndicatorConfiguration = (
  indicator: string
): IndicatorConfiguration => {
  switch (indicator) {
    case 'RSI':
      return {
        name: 'RSI',
        title: 'Average Crypto RSI',
        unit: '',
        categories: [
          {
            label: 'Oversold',
            color: '#22c55e',
            bgColor: 'bg-green-500',
            key: 'oversold',
          },
          {
            label: 'Neutral-Low',
            color: '#84cc16',
            bgColor: 'bg-lime-500',
            key: 'neutralLow',
          },
          {
            label: 'Neutral',
            color: '#6b7280',
            bgColor: 'bg-gray-500',
            key: 'neutral',
          },
          {
            label: 'Neutral-High',
            color: '#f97316',
            bgColor: 'bg-orange-500',
            key: 'neutralHigh',
          },
          {
            label: 'Overbought',
            color: '#ef4444',
            bgColor: 'bg-red-500',
            key: 'overbought',
          },
        ],
        getColor: (v: number) =>
          v <= 30
            ? '#22c55e'
            : v <= 45
              ? '#84cc16'
              : v <= 55
                ? '#6b7280'
                : v <= 70
                  ? '#f97316'
                  : '#ef4444',
        getLabel: (v: number) =>
          v <= 30
            ? 'Oversold'
            : v <= 45
              ? 'Neutral-Low'
              : v <= 55
                ? 'Neutral'
                : v <= 70
                  ? 'Neutral-High'
                  : 'Overbought',
        getCategoryPercentages: (values: number[]) => {
          const total = Math.max(values.length, 1);
          return {
            oversold: (values.filter((v) => v <= 30).length / total) * 100,
            neutralLow:
              (values.filter((v) => v > 30 && v <= 45).length / total) * 100,
            neutral:
              (values.filter((v) => v > 45 && v <= 55).length / total) * 100,
            neutralHigh:
              (values.filter((v) => v > 55 && v <= 70).length / total) * 100,
            overbought: (values.filter((v) => v > 70).length / total) * 100,
          };
        },
      };
    case 'BBPB':
      return {
        name: 'BB%B',
        title: 'Average Crypto BB%B',
        unit: '',
        categories: [
          {
            label: 'Low',
            color: '#22c55e',
            bgColor: 'bg-green-500',
            key: 'low',
          },
          {
            label: 'Mid-Low',
            color: '#84cc16',
            bgColor: 'bg-lime-500',
            key: 'midLow',
          },
          {
            label: 'Mid',
            color: '#6b7280',
            bgColor: 'bg-gray-500',
            key: 'mid',
          },
          {
            label: 'Mid-High',
            color: '#f97316',
            bgColor: 'bg-orange-500',
            key: 'midHigh',
          },
          {
            label: 'High',
            color: '#ef4444',
            bgColor: 'bg-red-500',
            key: 'high',
          },
        ],
        getColor: (v: number) =>
          v <= 0.2
            ? '#22c55e'
            : v <= 0.4
              ? '#84cc16'
              : v <= 0.6
                ? '#6b7280'
                : v <= 0.8
                  ? '#f97316'
                  : '#ef4444',
        getLabel: (v: number) =>
          v <= 0.2
            ? 'Low'
            : v <= 0.4
              ? 'Mid-Low'
              : v <= 0.6
                ? 'Mid'
                : v <= 0.8
                  ? 'Mid-High'
                  : 'High',
        getCategoryPercentages: (values: number[]) => {
          const total = Math.max(values.length, 1);
          return {
            low: (values.filter((v) => v <= 0.2).length / total) * 100,
            midLow:
              (values.filter((v) => v > 0.2 && v <= 0.4).length / total) * 100,
            mid:
              (values.filter((v) => v > 0.4 && v <= 0.6).length / total) * 100,
            midHigh:
              (values.filter((v) => v > 0.6 && v <= 0.8).length / total) * 100,
            high: (values.filter((v) => v > 0.8).length / total) * 100,
          };
        },
      };
    case 'VO':
      return {
        name: 'Volume Oscillator',
        title: 'Average Crypto Volume Oscillator',
        unit: '%',
        categories: [
          {
            label: 'Very Low',
            color: '#22c55e',
            bgColor: 'bg-green-500',
            key: 'veryLow',
          },
          {
            label: 'Low',
            color: '#84cc16',
            bgColor: 'bg-lime-500',
            key: 'low',
          },
          {
            label: 'Normal',
            color: '#6b7280',
            bgColor: 'bg-gray-500',
            key: 'normal',
          },
          {
            label: 'High',
            color: '#f97316',
            bgColor: 'bg-orange-500',
            key: 'high',
          },
          {
            label: 'Very High',
            color: '#ef4444',
            bgColor: 'bg-red-500',
            key: 'veryHigh',
          },
        ],
        getColor: (v: number) =>
          v <= -50
            ? '#22c55e'
            : v <= -10
              ? '#84cc16'
              : v <= 10
                ? '#6b7280'
                : v <= 50
                  ? '#f97316'
                  : '#ef4444',
        getLabel: (v: number) =>
          v <= -50
            ? 'Very Low'
            : v <= -10
              ? 'Low'
              : v <= 10
                ? 'Normal'
                : v <= 50
                  ? 'High'
                  : 'Very High',
        getCategoryPercentages: (values: number[]) => {
          const total = Math.max(values.length, 1);
          return {
            veryLow: (values.filter((v) => v <= -50).length / total) * 100,
            low:
              (values.filter((v) => v > -50 && v <= -10).length / total) * 100,
            normal:
              (values.filter((v) => v > -10 && v <= 10).length / total) * 100,
            high:
              (values.filter((v) => v > 10 && v <= 50).length / total) * 100,
            veryHigh: (values.filter((v) => v > 50).length / total) * 100,
          };
        },
      };
    case 'MAR':
      return {
        name: 'Price vs 20 EMA',
        title: 'Average Crypto Price vs 20 EMA',
        unit: '%',
        categories: [
          {
            label: 'Below -10%',
            color: '#22c55e',
            bgColor: 'bg-green-500',
            key: 'below10',
          },
          {
            label: 'Within -10% to 0%',
            color: '#84cc16',
            bgColor: 'bg-lime-500',
            key: 'within10',
          },
          {
            label: 'Within 0% to 10%',
            color: '#6b7280',
            bgColor: 'bg-gray-500',
            key: 'within0to10',
          },
          {
            label: 'Within 10% to 20%',
            color: '#f97316',
            bgColor: 'bg-orange-500',
            key: 'within10to20',
          },
          {
            label: 'Above 20%',
            color: '#ef4444',
            bgColor: 'bg-red-500',
            key: 'above20',
          },
        ],
        getColor: (v: number) =>
          v <= -10
            ? '#22c55e'
            : v <= 0
              ? '#84cc16'
              : v <= 10
                ? '#6b7280'
                : v <= 20
                  ? '#f97316'
                  : '#ef4444',
        getLabel: (v: number) =>
          v <= -10
            ? 'Below -10%'
            : v <= 0
              ? 'Within -10% to 0%'
              : v <= 10
                ? 'Within 0% to 10%'
                : v <= 20
                  ? 'Within 10% to 20%'
                  : 'Above 20%',
        getCategoryPercentages: (values: number[]) => {
          const total = Math.max(values.length, 1);
          return {
            below10: (values.filter((v) => v <= -10).length / total) * 100,
            within10:
              (values.filter((v) => v > -10 && v <= 0).length / total) * 100,
            within0to10:
              (values.filter((v) => v > 0 && v <= 10).length / total) * 100,
            within10to20:
              (values.filter((v) => v > 10 && v <= 20).length / total) * 100,
            above20: (values.filter((v) => v > 20).length / total) * 100,
          };
        },
      };
    default:
      return getIndicatorConfiguration('RSI');
  }
};
