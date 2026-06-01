import { logger } from '@/lib/loggerInstance';
import React, { useState } from 'react';
import { BotStatus } from './dashboard/BotStatus';
import { PortfolioValue } from './dashboard/PortfolioValue';

// Demo component to showcase the updated widgets with header dropdowns
export const UpdatedWidgetsDemo: React.FC = () => {
  const [portfolioWidgetId] = useState('portfolio-demo');
  const [statsWidgetId] = useState('stats-demo');

  return (
    <div className="p-xl bg-background min-h-screen">
      <h1 className="text-2xl font-bold mb-8 text-foreground">
        Updated Widgets Demo - Header Dropdowns
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl max-w-7xl">
        {/* Portfolio Value Widget */}
        <div className="h-96">
          <h2 className="text-lg font-semibold mb-4 text-foreground">
            Portfolio Value Widget
          </h2>
          <div className="h-full border border-border rounded-lg overflow-hidden">
            <PortfolioValue
              widgetId={portfolioWidgetId}
              isEditable={true}
              onRemove={() => logger.info('Remove portfolio widget')}
              onSettings={() => logger.info('Portfolio settings')}
              menuActions={{
                onDelete: () => logger.info('Delete portfolio'),
                onDuplicate: () => logger.info('Duplicate portfolio'),
              }}
            />
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            • Styled dropdown with border and background shows exchange
            selection
            <br />
            • Icons included in dropdown options (🟨 Binance, 🔵 Coinbase, etc.)
            <br />
            • Widget type shown as "(Portfolio Value)"
            <br />
            • Total value and change % displayed on the right
            <br />• Dynamic name: "Exchange | Filter" for widget manager
          </div>
        </div>

        {/* Statistics Widget */}
        <div className="h-96">
          <h2 className="text-lg font-semibold mb-4 text-foreground">
            Statistics Widget (Bot Stats)
          </h2>
          <div className="h-full border border-border rounded-lg overflow-hidden">
            <BotStatus
              widgetId={statsWidgetId}
              isEditable={true}
              onRemove={() => logger.info('Remove stats widget')}
              onSettings={() => logger.info('Stats settings')}
              menuActions={{
                onDelete: () => logger.info('Delete stats'),
                onDuplicate: () => logger.info('Duplicate stats'),
              }}
            />
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            • Styled dropdown with border shows bot type selection
            <br />
            • Icons included in dropdown options (📊 All Bots, 🔄 DCA Bots,
            etc.)
            <br />
            • Widget type shown as "(Statistics)"
            <br />• Dynamic name: "Bot Type | Bot Type Name" for widget manager
          </div>
        </div>
      </div>

      <div className="mt-8 p-md bg-muted/30 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-foreground">
          Key Changes Made:
        </h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>✅ Moved dropdowns from widget content to header</li>
          <li>✅ Added styled dropdowns with border and background</li>
          <li>✅ Included icons in dropdown options</li>
          <li>✅ Added widget type display next to dropdown</li>
          <li>✅ Portfolio value shows total and change on right side</li>
          <li>
            ✅ Dynamic naming for widget manager: "Selected Value | Filters"
          </li>
          <li>✅ Responsive header layout with proper truncation</li>
          <li>✅ Backward compatible - existing widgets still work</li>
        </ul>
      </div>
    </div>
  );
};

export default UpdatedWidgetsDemo;
