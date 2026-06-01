import { useNotificationsSettingsStore } from '@/stores/notificationsSettingsStore';
import { useVisualSettingsStore } from '@/stores/visualSettingsStore';
import { playNotificationSound } from '@/utils/soundUtils';
import React from 'react';
import { NotificationCore } from './NotificationCore';

export interface OrderFilledNotificationProps {
  pair: string;
  baseAsset: string;
  quoteAsset: string;
  exchangeUUID: string;
  isPaperTrading: boolean;
  side: 'BUY' | 'SELL' | 'buy' | 'sell';
  price?: number;
  executedQty?: number;
  total?: number;
  amount?: number;
  timestamp: Date;
  onClose: () => void;
}

export const OrderFilledNotification: React.FC<
  OrderFilledNotificationProps
> = ({
  pair,
  baseAsset,
  quoteAsset,
  exchangeUUID,
  isPaperTrading,
  side,
  price,
  executedQty,
  total,

  timestamp,
  onClose,
}) => {
  const globalSoundEnabled = useVisualSettingsStore((state) => state.soundEnabled);
  const normalizedSide = side.toUpperCase() as 'BUY' | 'SELL';
  const notificationType = normalizedSide === 'BUY' ? 'buyOrderFilled' : 'sellOrderFilled';
  const soundSetting = useNotificationsSettingsStore(
    (state) => state.soundSettings[notificationType]
  );

  // Play sound when notification appears
  React.useEffect(() => {
    if (globalSoundEnabled && soundSetting?.enabled) {
      playNotificationSound(soundSetting.soundFile, soundSetting.extension);
    }
  }, [globalSoundEnabled, soundSetting]);

  // Build description: BUY/SELL {executedQty} {baseAsset for longs/quoteAsset for shorts} @ {price} ({total} {quoteAsset for longs/baseAsset for shorts})
  // For longs (BUY): bought baseAsset with quoteAsset
  // For shorts (SELL): sold baseAsset for quoteAsset
  let description = '';
  if (executedQty && price && total) {
    const qty = executedQty.toFixed(8).replace(/\.?0+$/, ''); // Remove trailing zeros
    const priceFormatted = price.toFixed(8).replace(/\.?0+$/, '');
    const totalFormatted = total.toFixed(8).replace(/\.?0+$/, '');

    if (normalizedSide === 'BUY') {
      // Long: bought baseAsset with quoteAsset
      description = `${normalizedSide} ${qty} ${baseAsset} @ ${priceFormatted} (${totalFormatted} ${quoteAsset})`;
    } else {
      // Short: sold baseAsset for quoteAsset
      description = `${normalizedSide} ${qty} ${baseAsset} @ ${priceFormatted} (${totalFormatted} ${quoteAsset})`;
    }
  } else if (price) {
    description = `${normalizedSide}: $${price.toFixed(2)} ${quoteAsset}`;
  } else {
    description = `${normalizedSide} order filled`;
  }

  return (
    <NotificationCore
      pair={pair}
      baseAsset={baseAsset}
      quoteAsset={quoteAsset}
      isPaperTrading={isPaperTrading}
      title="Order Filled"
      description={description}
      exchangeUUID={exchangeUUID}
      timestamp={timestamp}
      onClose={onClose}
    />
  );
};
