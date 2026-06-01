import React, { type ReactNode } from 'react';
import { X } from 'lucide-react';
import { TradingModeIcon } from '@/components/common/TradingModeIcon';
import CoinPair from '@/components/widgets/shared/CoinPair';
import { getRelativeTime } from '@/utils/timeUtils';
import { Card } from '../card';
import { ExchangeChip } from '../chip/ExchangeChip';
import { TimeChip } from '../chip/TimeChip';

export interface NotificationCoreProps {
  // Pair info for left side
  pair: string;
  baseAsset: string;
  quoteAsset: string;

  // Trading mode
  isPaperTrading: boolean;

  // Title and content
  title: string;
  subtitle?: string;
  description: ReactNode;

  // Bottom metadata
  exchangeUUID: string;
  timestamp: Date;

  // Close handler
  onClose: () => void;
}

export const NotificationCore: React.FC<NotificationCoreProps> = ({
  pair,
  baseAsset,
  quoteAsset,
  title,
  subtitle,
  description,
  exchangeUUID,
  timestamp,
  onClose,
}) => {
  const timeAgo = getRelativeTime(timestamp.getTime());

  return (
    <Card
      position={1}
      className="w-[330px] p-2! pb-2! space-y-0! animate-in slide-in-from-right-full duration-300"
    >
      <div className="flex gap-2 mb-0">
        {/* Left side: Coin pair in colored box */}
        <div
          className="w-[65px] h-[55px] rounded-lg flex items-center justify-center shrink-0"
          style={{
            backgroundColor: 'var(--color-background)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          <CoinPair
            baseAsset={baseAsset}
            quoteAsset={quoteAsset}
            pair={pair}
            iconSize="lg"
            showText={false}
          />
        </div>

        {/* Right side: Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          {/* Top section: Title, subtitle, description, close button */}
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0 flex-1">
              {/* Title */}
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-xs font-semibold text-foreground truncate">
                  {title}
                </span>
              </div>

              {/* Subtitle */}
              {subtitle && (
                <div className="text-xs text-muted-foreground truncate leading-tight mb-0.5">
                  {subtitle}
                </div>
              )}

              {/* Description */}
              <div className="text-xs text-foreground leading-tight">
                {description}
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom section: Paper/Live icon, Exchange and time */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-0">
          <TradingModeIcon size="sm" showTooltip={false} />
          <ExchangeChip
            exchangeId={exchangeUUID}
            size="xs"
            chipStyle="ghost"
            showIcon={true}
          />
        </div>
        <TimeChip time={timeAgo} size="xs" chipStyle="ghost" showIcon />
      </div>
    </Card>
  );
};
