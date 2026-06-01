import React from 'react';
import type { Props } from './shared';
import { ComboBotAnim } from './ComboBotAnim';
import { DcaBotAnim } from './DcaBotAnim';
import { GridBotAnim } from './GridBotAnim';

export { ComboBotAnim } from './ComboBotAnim';
export { DcaBotAnim } from './DcaBotAnim';
export { GridBotAnim } from './GridBotAnim';

/** Map from bot-type id (DCA = `dca`, etc.) to the animation component. */
export const BOT_TYPE_ANIMATIONS: Record<
  string,
  React.FC<Props> | undefined
> = {
  dca: DcaBotAnim,
  grid: GridBotAnim,
  combo: ComboBotAnim,
};
