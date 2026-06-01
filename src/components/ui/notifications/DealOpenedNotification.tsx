import { useNotificationsSettingsStore } from '@/stores/notificationsSettingsStore';
import { useVisualSettingsStore } from '@/stores/visualSettingsStore';
import { playNotificationSound } from '@/utils/soundUtils';
import React from 'react';
import { NotificationCore } from './NotificationCore';

export interface DealOpenedNotificationProps {
  botName: string;
  pair: string;
  baseAsset: string;
  quoteAsset: string;
  exchangeUUID: string;
  isPaperTrading: boolean;
  price?: number;
  timestamp: Date;
  onClose: () => void;
}

export const DealOpenedNotification: React.FC<DealOpenedNotificationProps> = ({
  botName,
  pair,
  baseAsset,
  quoteAsset,
  exchangeUUID,
  isPaperTrading,
  price,
  timestamp,
  onClose,
}) => {
  const globalSoundEnabled = useVisualSettingsStore((state) => state.soundEnabled);
  const soundSetting = useNotificationsSettingsStore(
    (state) => state.soundSettings.dealStarted
  );

  // Play sound when notification appears
  React.useEffect(() => {
    if (globalSoundEnabled && soundSetting?.enabled) {
      playNotificationSound(soundSetting.soundFile, soundSetting.extension);
    }
  }, [globalSoundEnabled, soundSetting]);

  return (
    <NotificationCore
      pair={pair}
      baseAsset={baseAsset}
      quoteAsset={quoteAsset}
      isPaperTrading={isPaperTrading}
      title="Deal Started"
      subtitle={botName}
      description={
        price
          ? `Price: $${price.toFixed(2)} ${quoteAsset}`
          : `Started trading ${pair}`
      }
      exchangeUUID={exchangeUUID}
      timestamp={timestamp}
      onClose={onClose}
    />
  );
};
