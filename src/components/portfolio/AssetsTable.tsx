import React from 'react';

export const AssetsTable: React.FC = () => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-2 font-medium text-muted-foreground">
              Assets
            </th>
            <th className="text-right py-3 px-2 font-medium text-muted-foreground">
              Total coins
            </th>
            <th className="text-right py-3 px-2 font-medium text-muted-foreground">
              In Orders
            </th>
            <th className="text-right py-3 px-2 font-medium text-muted-foreground">
              Available
            </th>
            <th className="text-right py-3 px-2 font-medium text-muted-foreground">
              BTC Value
            </th>
            <th className="text-right py-3 px-2 font-medium text-muted-foreground">
              USD Value
            </th>
            <th className="text-right py-3 px-2 font-medium text-muted-foreground">
              7d price
            </th>
            <th className="text-right py-3 px-2 font-medium text-muted-foreground">
              30d price
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td
              colSpan={8}
              className="text-center py-8 text-muted-foreground text-sm"
            >
              No assets data available
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
