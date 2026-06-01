import { Search } from 'lucide-react';
import React from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';

interface ActiveBotsPanelProps {
  onBotSelect?: (botId: string) => void;
  selectedBot?: string;
}

export const ActiveBotsPanel: React.FC<ActiveBotsPanelProps> = ({
  onBotSelect: _onBotSelect,
  selectedBot: _selectedBot,
}) => {
  return (
    <Card className="p-md">
      <h2 className="font-semibold text-lg mb-4">Active Bots</h2>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search by name, exchange, currency"
          className="pl-10"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-muted rounded-lg p-1 mb-4">
        {['All', 'Signal', 'Grid', 'DCA'].map((tab) => (
          <Button
            key={tab}
            variant={tab === 'All' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
          >
            {tab}
          </Button>
        ))}
      </div>

      {/* Bot List */}
      <div className="space-y-xs">
        <div className="text-center py-8 text-muted-foreground">
          <p>No bots found</p>
        </div>
      </div>
    </Card>
  );
};
