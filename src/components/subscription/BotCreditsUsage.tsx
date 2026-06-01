// Subscription credits usage stub.
import React from 'react';

interface BotCreditsUsageProps {
  creditsLocked: number;
  creditsBalance: number;
  consumableCreditsUsed?: number | undefined;
  consumableCreditsTotal?: number | undefined;
  extraPurchasedCredits?: number | undefined;
  monthlyConsumableCredits?: number | undefined;
  creditsProgressMax?: number;
  className?: string;
  compact?: boolean;
}

export const BotCreditsUsage: React.FC<BotCreditsUsageProps> = () => null;
