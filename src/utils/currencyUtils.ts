// Currency utility functions — pure helpers, no mock data

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate: number;
}

export const currencies: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1 },
  { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.85 },
  { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.73 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate: 110.0 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', rate: 1.25 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rate: 1.35 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', rate: 0.92 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', rate: 6.45 },
];

export const getCurrencyInfo = (currencyCode: string): Currency => {
  const currency = currencies.find((c) => c.code === currencyCode);
  return currency || currencies[0]; // Default to USD
};

export const formatValueInCurrency = (
  value: number,
  currencyCode: string = 'USD'
) => {
  const currencyInfo = getCurrencyInfo(currencyCode);
  const convertedValue = value * currencyInfo.rate;

  return {
    value: convertedValue,
    formatted: convertedValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    symbol: currencyInfo.symbol,
    currency: currencyInfo.code,
  };
};
