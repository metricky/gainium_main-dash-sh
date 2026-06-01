import { useDcaDeals } from '@/hooks/useDcaDeals';
import React from 'react';
// no extra imports needed; metrics come from the hook
import TreemapBase, { type TreemapBaseProps } from './TreemapBase';

export type TreemapDealsProps = Omit<
  TreemapBaseProps,
  'scope' | 'title' | 'widgetType' | 'dcaDeals'
>;

const TreemapDeals: React.FC<TreemapDealsProps> = (props) => {
  // Load DCA deals data
  const { deals, dealMetrics } = useDcaDeals({
    terminal: false,
  });

  // Build a minimal prices array from deals' own avgPrice as fallback; would be better to reuse a shared price feed
  // prices handled centrally by the hook for parity

  // dealMetrics now supplied by hook to ensure parity with Trades and single source of truth

  return (
    <TreemapBase
      {...props}
      scope="deals"
      title="Treemap: Deals"
      widgetType="treemap-deals"
      dcaDeals={deals}
      dealMetrics={dealMetrics}
    />
  );
};

export default TreemapDeals;
