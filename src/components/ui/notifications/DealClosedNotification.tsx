import { useNotificationsSettingsStore } from '@/stores/notificationsSettingsStore';
import { useVisualSettingsStore } from '@/stores/visualSettingsStore';
import { playNotificationSound } from '@/utils/soundUtils';
import React from 'react';
import { ProfitLossPercChip } from '../chip/ProfitLossPercChip';
import { NotificationCore } from './NotificationCore';

export interface DealClosedNotificationProps {
  botName: string;
  pair: string;
  baseAsset: string;
  quoteAsset: string;
  exchangeUUID: string;
  isPaperTrading: boolean;
  profit?: number;
  profitPercentage?: number;
  timestamp: Date;
  onClose: () => void;
}

export const DealClosedNotification: React.FC<DealClosedNotificationProps> = ({
  botName,
  pair,
  baseAsset,
  quoteAsset,
  exchangeUUID,
  isPaperTrading,
  profit,
  profitPercentage,
  timestamp,
  onClose,
}) => {
  const globalSoundEnabled = useVisualSettingsStore((state) => state.soundEnabled);
  const soundSetting = useNotificationsSettingsStore(
    (state) => state.soundSettings.dealClosedWithPnL
  );

  // Play sound when notification appears
  React.useEffect(() => {
    if (globalSoundEnabled && soundSetting?.enabled) {
      playNotificationSound(soundSetting.soundFile, soundSetting.extension);
    }
  }, [globalSoundEnabled, soundSetting]);

  const isProfit = (profit ?? 0) >= 0;

  // Build description with PnL and percentage chip
  const description = (
    <div className="flex items-center gap-1.5">
      {profit !== undefined && (
        <span
          className={`font-semibold ${
            isProfit ? 'text-success' : 'text-destructive'
          }`}
        >
          {isProfit ? '+' : ''}${profit.toFixed(2)}
        </span>
      )}
      {profitPercentage !== undefined && (
        <ProfitLossPercChip value={profitPercentage} size="xs" />
      )}
    </div>
  );

  return (
    <NotificationCore
      pair={pair}
      baseAsset={baseAsset}
      quoteAsset={quoteAsset}
      isPaperTrading={isPaperTrading}
      title="Deal Closed"
      subtitle={botName}
      description={description}
      exchangeUUID={exchangeUUID}
      timestamp={timestamp}
      onClose={onClose}
    />
  );
};
