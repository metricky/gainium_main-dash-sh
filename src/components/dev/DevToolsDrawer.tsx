import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useDevToolsStore } from '@/stores/useDevToolsStore';
import { Bug, Database, Sparkles, X } from 'lucide-react';
import React from 'react';
import { LoggerContent } from './LoggerContent';
import { QueryCacheContent } from './QueryCacheContent';
import { TriggersContent } from './TriggersContent';

export const DevToolsDrawer: React.FC = () => {
  const { isOpen, activeTab, closeDrawer, setActiveTab } = useDevToolsStore();
  if (!import.meta.env.DEV) return null;
  if (!isOpen) {
    return null;
  }
  return (
    <aside
      className={cn(
        'relative h-full overflow-hidden transition-[width] duration-300 ease-in-out bg-background border-l flex flex-col',
        isOpen
          ? 'w-96 min-w-[24rem] border-border'
          : 'w-0 min-w-0 border-transparent pointer-events-none'
      )}
      aria-hidden={!isOpen}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-md border-b border-border bg-card">
        <div className="flex items-center gap-xs">
          <h2 className="text-lg font-semibold">Dev Tools</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={closeDrawer}
          title="Close"
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        paramSync={false}
        onValueChange={(value) =>
          setActiveTab(value as 'logger' | 'query-cache' | 'triggers')
        }
        className="flex-1 flex flex-col min-h-0"
      >
        <TabsList className="w-full grid grid-cols-3 bg-muted/50 rounded-none border-b">
          <TabsTrigger value="logger" className="gap-xs">
            <Bug className="h-4 w-4" />
            Logger
          </TabsTrigger>
          <TabsTrigger value="query-cache" className="gap-xs">
            <Database className="h-4 w-4" />
            Query Cache
          </TabsTrigger>
          <TabsTrigger value="triggers" className="gap-xs">
            <Sparkles className="h-4 w-4" />
            Triggers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logger" className="flex-1 min-h-0 m-0">
          <LoggerContent />
        </TabsContent>

        <TabsContent value="query-cache" className="flex-1 min-h-0 m-0">
          <QueryCacheContent />
        </TabsContent>

        <TabsContent value="triggers" className="flex-1 min-h-0 m-0">
          <TriggersContent />
        </TabsContent>
      </Tabs>
    </aside>
  );
};

export default DevToolsDrawer;
