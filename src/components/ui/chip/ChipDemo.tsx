import React from 'react';
import {
  Chip,
  ExchangeChip,
  BotTypeChip,
  StrategyChip,
  StatusChip,
} from '@/components/ui/chip';
import { BotTypesEnum } from '@/types';

/**
 * Demo component showcasing all chip variants and their usage
 */
export const ChipDemo: React.FC = () => {
  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold mb-6">Chip Components Demo</h1>

      {/* Base Chip Variants */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Base Chip Variants</h2>
        <div className="flex flex-wrap gap-2">
          <Chip variant="default">Default</Chip>
          <Chip variant="success">Success</Chip>
          <Chip variant="warning">Warning</Chip>
          <Chip variant="error">Error</Chip>
          <Chip variant="info">Info</Chip>
          <Chip variant="primary">Primary</Chip>
          <Chip variant="secondary">Secondary</Chip>
          <Chip variant="destructive">Destructive</Chip>
          <Chip variant="outline">Outline</Chip>
        </div>
      </section>

      {/* Chip Styles */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Chip Styles</h2>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Chip variant="success" chipStyle="solid">
              Solid
            </Chip>
            <Chip variant="success" chipStyle="outline">
              Outline
            </Chip>
            <Chip variant="success" chipStyle="ghost">
              Ghost
            </Chip>
            <Chip variant="success" chipStyle="soft">
              Soft
            </Chip>
          </div>
        </div>
      </section>

      {/* Chip Sizes */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Chip Sizes</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Chip variant="primary" size="xs">
            Extra Small
          </Chip>
          <Chip variant="primary" size="sm">
            Small
          </Chip>
          <Chip variant="primary" size="md">
            Medium
          </Chip>
          <Chip variant="primary" size="lg">
            Large
          </Chip>
          <Chip variant="primary" size="xl">
            Extra Large
          </Chip>
        </div>
      </section>

      {/* Exchange Chips */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Exchange Chips</h2>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <ExchangeChip exchangeId="binance" />
            <ExchangeChip exchangeId="bybit" />
            <ExchangeChip exchangeId="okx" />
            <ExchangeChip exchangeId="kucoin" />
          </div>
          <div className="flex flex-wrap gap-2">
            <ExchangeChip
              exchangeId="binancePaper"
              displayName="Binance Paper Trading"
            />
            <ExchangeChip
              exchangeId="bybitLinear"
              displayName="Bybit Futures"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <ExchangeChip exchangeId="binance" size="xs" />
            <ExchangeChip exchangeId="binance" size="sm" />
            <ExchangeChip exchangeId="binance" size="md" />
            <ExchangeChip exchangeId="binance" size="lg" />
          </div>
        </div>
      </section>

      {/* Bot Type Chips */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Bot Type Chips</h2>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <BotTypeChip botType={BotTypesEnum.dca} />
            <BotTypeChip botType={BotTypesEnum.grid} />
            <BotTypeChip botType={BotTypesEnum.combo} />
            <BotTypeChip botType={BotTypesEnum.hedgeCombo} />
          </div>
          <div className="flex flex-wrap gap-2">
            <BotTypeChip botType={BotTypesEnum.dca} chipStyle="solid" />
            <BotTypeChip botType={BotTypesEnum.grid} chipStyle="outline" />
            <BotTypeChip botType={BotTypesEnum.combo} chipStyle="ghost" />
            <BotTypeChip botType={BotTypesEnum.hedgeCombo} chipStyle="soft" />
          </div>
          <div className="flex flex-wrap gap-2">
            <BotTypeChip botType={BotTypesEnum.dca} size="sm" />
            <BotTypeChip botType={BotTypesEnum.grid} size="md" />
            <BotTypeChip botType={BotTypesEnum.combo} size="lg" />
          </div>
        </div>
      </section>

      {/* Strategy Chips */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Strategy Chips</h2>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <StrategyChip strategy="LONG" />
            <StrategyChip strategy="SHORT" />
            <StrategyChip strategy="NEUTRAL" />
          </div>
          <div className="flex flex-wrap gap-2">
            <StrategyChip strategy="LONG" chipStyle="outline" />
            <StrategyChip strategy="SHORT" chipStyle="soft" />
            <StrategyChip strategy="NEUTRAL" chipStyle="ghost" />
          </div>
          <div className="flex flex-wrap gap-2">
            <StrategyChip strategy="LONG" size="sm" />
            <StrategyChip strategy="SHORT" size="md" />
            <StrategyChip strategy="NEUTRAL" size="lg" />
          </div>
        </div>
      </section>

      {/* Status Chips */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Status Chips</h2>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <StatusChip status="open" />
            <StatusChip status="range" />
            <StatusChip status="monitoring" />
            <StatusChip status="error" />
            <StatusChip status="closed" />
            <StatusChip status="active" />
            <StatusChip status="paused" />
            <StatusChip status="stopped" />
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusChip status="open" chipStyle="solid" />
            <StatusChip status="error" chipStyle="outline" />
            <StatusChip status="monitoring" chipStyle="ghost" />
            <StatusChip status="closed" showDot={false} />
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusChip status="open" size="xs" />
            <StatusChip status="range" size="sm" />
            <StatusChip status="monitoring" size="md" />
            <StatusChip status="error" size="lg" />
          </div>
        </div>
      </section>

      {/* Real-world Usage Examples */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Real-world Usage Examples</h2>
        <div className="space-y-4">
          {/* Bot Card Header Example */}
          <div className="p-4 border border-border rounded-lg bg-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">My DCA Bot</h3>
              <StatusChip status="open" size="xs" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-mono">BTC/USDT</span>
              <StrategyChip strategy="LONG" size="xs" />
            </div>
            <div className="flex items-center gap-2">
              <BotTypeChip
                botType={BotTypesEnum.dca}
                size="xs"
                chipStyle="soft"
              />
              <ExchangeChip exchangeId="binance" size="xs" chipStyle="ghost" />
            </div>
          </div>

          {/* Filter Bar Example */}
          <div className="p-4 border border-border rounded-lg bg-card">
            <h4 className="text-sm font-medium mb-2">Active Filters:</h4>
            <div className="flex flex-wrap gap-1">
              <StatusChip status="open" size="xs" chipStyle="soft" />
              <BotTypeChip
                botType={BotTypesEnum.dca}
                size="xs"
                chipStyle="soft"
              />
              <StrategyChip strategy="LONG" size="xs" chipStyle="soft" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
