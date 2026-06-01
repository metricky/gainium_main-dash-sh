import { getCSSVar, interpolateColors } from '@/lib/utils/chart';

export function getCustomThemeColors(_theme?: string) {
  const successColor = getCSSVar('--color-profit');
  const destructiveColor = getCSSVar('--color-loss');

  const createColorArray = (midColor: string) => {
    const lighterColors = interpolateColors('#ffffff', midColor);
    const darkerColors = interpolateColors(midColor, '#000000');
    return [...lighterColors, midColor, ...darkerColors.slice(0, -1)];
  };

  const whiteColor = '#ffffff';
  const blackColor = '#000000';

  const themeConfig = {
    color1: createColorArray(getCSSVar('--color-primary')),
    color2: createColorArray('#575757'),
    color3: createColorArray(destructiveColor),
    color4: createColorArray(successColor),
    color5: createColorArray('#8b5cf6'),
    color6: createColorArray('#3b82f6'),
    color7: createColorArray('#06b6d4'),
    white: whiteColor,
    black: blackColor,
  };

  return themeConfig;
}
