import { IndicatorEnum } from '@/types';

export const toIndicatorFavoriteCode = (type: IndicatorEnum): string => type;

export const fromIndicatorFavoriteCode = (
  code: IndicatorEnum | null | undefined
): IndicatorEnum | null => {
  if (!code) {
    return null;
  }

  return code;
};

export const serializeIndicatorFavoriteTypes = (
  favorites: Iterable<IndicatorEnum>
): string[] => {
  const seen = new Set<string>();
  const codes: string[] = [];

  for (const favorite of favorites) {
    const code = toIndicatorFavoriteCode(favorite);
    if (!seen.has(code)) {
      seen.add(code);
      codes.push(code);
    }
  }

  return codes;
};

export const parseIndicatorFavoriteCodes = (
  codes: Array<IndicatorEnum | null | undefined>
): { favorites: IndicatorEnum[]; unknownCodes: string[] } => {
  const favorites: IndicatorEnum[] = [];
  const unknownCodes: string[] = [];
  const seen = new Set<IndicatorEnum>();

  for (const code of codes) {
    if (!code) {
      continue;
    }

    const indicatorType = code;
    if (indicatorType) {
      if (!seen.has(indicatorType)) {
        seen.add(indicatorType);
        favorites.push(indicatorType);
      }
      continue;
    }

    unknownCodes.push(code);
  }

  return { favorites, unknownCodes };
};

export const isSupportedIndicatorFavoriteCode = (
  code: IndicatorEnum | null | undefined
): code is IndicatorEnum => !!code && !!fromIndicatorFavoriteCode(code);
