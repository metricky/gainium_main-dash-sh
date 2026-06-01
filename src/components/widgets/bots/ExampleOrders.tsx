import React, { useMemo } from 'react';
import { WidgetWrapper, type WidgetMenuActions } from '../WidgetWrapper';
import { getCompatibilityDefaultSize } from '../DefaultWidgetSizes';
import { cn } from '../../../lib/utils';
import { TrendingUp, TrendingDown, Calculator } from 'lucide-react';

export interface ExampleOrdersProps {
  widgetId: string;
  botId?: string;
  isEditable?: boolean;
  onRemove?: () => void;
  onSettings?: () => void;
  onCollapse?: (widgetId: string, collapsed: boolean) => void;
  onTabMove?: (
    fromTabId: string,
    toWidgetId: string,
    toTabIndex: number
  ) => void;
  menuActions?: WidgetMenuActions;
}

interface OrderRow {
  id: string;
  index: number;
  price: string;
  side: string;
  qty: string;
  label: string;
  priceDeviation: string;
  avgPrice: string;
  requiredPrice: string;
  requiredPriceInPercent: string;
  base: string;
  quote: string;
  note: string;
}

export const ExampleOrders: React.FC<ExampleOrdersProps> = ({
  widgetId,
  onRemove,
  onSettings,
  onCollapse,
  onTabMove,
}) => {
  // Mock data for example orders - in real implementation this would come from DCA context
  const mockOrders: OrderRow[] = useMemo(
    () => [
      {
        id: '1',
        index: 1,
        price: '45,230.50',
        side: 'BUY',
        qty: '0.0021 BTC (100.00 USDT)',
        label: 'Smart order',
        priceDeviation: '-2.5%',
        avgPrice: '45,180.25',
        requiredPrice: '46,150.75',
        requiredPriceInPercent: '+2.0%',
        base: '0.0021',
        quote: '95.28',
        note: 'Initial safety order',
      },
      {
        id: '2',
        index: 2,
        price: '43,680.25',
        side: 'BUY',
        qty: '0.0023 BTC (100.00 USDT)',
        label: 'Smart order',
        priceDeviation: '-4.8%',
        avgPrice: '44,430.38',
        requiredPrice: '45,890.50',
        requiredPriceInPercent: '+3.3%',
        base: '0.0044',
        quote: '195.28',
        note: 'Safety order 1',
      },
      {
        id: '3',
        index: 3,
        price: '42,130.00',
        side: 'BUY',
        qty: '0.0025 BTC (100.00 USDT)',
        label: 'Smart order',
        priceDeviation: '-7.1%',
        avgPrice: '43,680.25',
        requiredPrice: '45,230.50',
        requiredPriceInPercent: '+4.6%',
        base: '0.0069',
        quote: '295.28',
        note: 'Safety order 2',
      },
      {
        id: '4',
        index: 4,
        price: '40,579.75',
        side: 'BUY',
        qty: '0.0028 BTC (100.00 USDT)',
        label: 'Smart order',
        priceDeviation: '-9.4%',
        avgPrice: '42,930.13',
        requiredPrice: '44,570.50',
        requiredPriceInPercent: '+5.9%',
        base: '0.0097',
        quote: '395.28',
        note: 'Safety order 3',
      },
      {
        id: '5',
        index: 5,
        price: '39,029.50',
        side: 'BUY',
        qty: '0.0032 BTC (100.00 USDT)',
        label: 'Smart order',
        priceDeviation: '-11.7%',
        avgPrice: '42,180.00',
        requiredPrice: '43,910.50',
        requiredPriceInPercent: '+7.2%',
        base: '0.0129',
        quote: '495.28',
        note: 'Safety order 4',
      },
      {
        id: '6',
        index: 6,
        price: '46,780.75',
        side: 'SELL',
        qty: '0.0129 BTC (600.00 USDT)',
        label: 'Take profit',
        priceDeviation: '+3.5%',
        avgPrice: '',
        requiredPrice: '',
        requiredPriceInPercent: '',
        base: '0.0129',
        quote: '600.00',
        note: 'Take profit target',
      },
    ],
    []
  );

  const wrapperProps = {
    metadata: {
      id: widgetId,
      type: 'example-orders',
      title: 'Example Orders for a Deal',
      defaultSize: getCompatibilityDefaultSize('example-orders'),
      minSize: { w: 8, h: 6 },
      maxSize: { w: 12, h: 10 },
      hasOptions: true,
    },
    children: (
      <div className="p-md space-y-md">
        <div className="flex items-center gap-xs text-sm text-muted-foreground">
          <Calculator className="h-4 w-4" />
          <span>
            Preview of orders that would be placed for a sample DCA deal
          </span>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">
                  #
                </th>
                <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">
                  Price
                </th>
                <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">
                  Side
                </th>
                <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">
                  Quantity
                </th>
                <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">
                  Type
                </th>
                <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">
                  Price Dev.
                </th>
                <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">
                  Avg Price
                </th>
                <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">
                  Req. Price
                </th>
                <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">
                  Req. %
                </th>
                <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">
                  Total Base
                </th>
                <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">
                  Total Quote
                </th>
                <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">
                  Note
                </th>
              </tr>
            </thead>
            <tbody>
              {mockOrders.map((order) => (
                <tr key={order.id} className="border-b">
                  <td className="p-xs align-middle font-medium">
                    {order.index}
                  </td>
                  <td className="p-xs align-middle font-mono text-sm">
                    {order.price}
                  </td>
                  <td className="p-xs align-middle">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                        order.side === 'BUY'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      )}
                    >
                      {order.side === 'BUY' ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {order.side}
                    </span>
                  </td>
                  <td className="p-xs align-middle font-mono text-sm">
                    {order.qty}
                  </td>
                  <td className="p-xs align-middle">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                      {order.label}
                    </span>
                  </td>
                  <td
                    className={cn(
                      'p-xs align-middle font-mono text-sm',
                      order.priceDeviation.startsWith('-')
                        ? 'text-red-600'
                        : 'text-green-600'
                    )}
                  >
                    {order.priceDeviation}
                  </td>
                  <td className="p-xs align-middle font-mono text-sm">
                    {order.avgPrice}
                  </td>
                  <td className="p-xs align-middle font-mono text-sm">
                    {order.requiredPrice}
                  </td>
                  <td
                    className={cn(
                      'p-xs align-middle font-mono text-sm',
                      order.requiredPriceInPercent.startsWith('+')
                        ? 'text-green-600'
                        : ''
                    )}
                  >
                    {order.requiredPriceInPercent}
                  </td>
                  <td className="p-xs align-middle font-mono text-sm">
                    {order.base}
                  </td>
                  <td className="p-xs align-middle font-mono text-sm">
                    {order.quote}
                  </td>
                  <td className="p-xs align-middle text-sm text-muted-foreground">
                    {order.note}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Total orders: {mockOrders.length}</span>
          <span>
            Buy orders: {mockOrders.filter((o) => o.side === 'BUY').length}
          </span>
          <span>
            Sell orders: {mockOrders.filter((o) => o.side === 'SELL').length}
          </span>
        </div>
      </div>
    ),
    ...(onRemove && { onRemove }),
    ...(onSettings && { onSettings }),
    ...(onTabMove && { onTabMove }),
    ...(onCollapse && { onCollapse }),
  };

  return <WidgetWrapper {...wrapperProps} />;
};

export default ExampleOrders;
