import { Plus, Search, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { getAvailableBotWidgetTypes, getBotWidgetMetadata } from './bots';
import { WIDGET_REGISTRY, type WidgetType } from './dashboard';
import {
  getAvailableNavigationWidgetTypes,
  getNavigationWidgetMetadata,
} from './navigation';
import {
  getAvailableTradingWidgetTypes,
  getTradingWidgetMetadata,
} from './trading';

interface CategorizedWidget {
  type: string;
  title: string;
  description: string;
  category: string;
  defaultSize: { w: number; h: number };
  hasOptions: boolean;
}

interface AddWidgetButtonProps {
  registry: 'dashboard' | 'trading' | 'bot' | 'navigation';
  onAddWidget: (
    widgetType: CategorizedWidget,
    isNavigationWidget?: boolean
  ) => void;
  existingWidgets?: Array<{ type: string }>;
  className?: string;
  variant?: 'default' | 'dashed';
  children?: React.ReactNode;
}

const AddWidgetButton: React.FC<AddWidgetButtonProps> = ({
  registry,
  onAddWidget,
  existingWidgets = [],
  className = '',
  variant = 'default',
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Get available widget types based on registry
  const availableWidgetTypes: CategorizedWidget[] = useMemo(() => {
    if (registry === 'navigation') {
      return getAvailableNavigationWidgetTypes()
        .filter((type) => {
          // For navigation widgets, filter out types that already exist
          return !existingWidgets.some((widget) => widget.type === type);
        })
        .map((type) => ({
          type,
          title: getNavigationWidgetMetadata(type)?.title || type,
          description: getNavigationWidgetMetadata(type)?.description || '',
          category: getNavigationWidgetMetadata(type)?.category || 'Navigation',
          defaultSize: { w: 6, h: 4 },
          hasOptions: getNavigationWidgetMetadata(type)?.hasOptions || false,
        }));
    }

    if (registry === 'trading') {
      return getAvailableTradingWidgetTypes().map((type) => ({
        type,
        title: getTradingWidgetMetadata(type)?.title || type,
        description: getTradingWidgetMetadata(type)?.description || '',
        category: getTradingWidgetMetadata(type)?.category || 'Other',
        defaultSize: getTradingWidgetMetadata(type)?.defaultSize || {
          w: 6,
          h: 4,
        },
        hasOptions: getTradingWidgetMetadata(type)?.hasOptions || false,
      }));
    }

    if (registry === 'bot') {
      return getAvailableBotWidgetTypes().map((type) => ({
        type,
        title: getBotWidgetMetadata(type)?.title || type,
        description: '',
        category: getBotWidgetMetadata(type)?.category || 'Other',
        defaultSize: getBotWidgetMetadata(type)?.defaultSize || { w: 6, h: 4 },
        hasOptions: getBotWidgetMetadata(type)?.hasOptions || false,
      }));
    }

    // Dashboard widgets
    return Object.entries(WIDGET_REGISTRY).map(([type, config]) => ({
      type: type as WidgetType,
      title: config.metadata.title,
      description:
        (config.metadata as { description?: string }).description || '',
      category: (config.metadata as { category?: string }).category || 'Other',
      defaultSize: config.metadata.defaultSize,
      hasOptions: config.metadata.hasOptions,
    }));
  }, [registry, existingWidgets]);

  // Group widgets by category
  const widgetsByCategory = availableWidgetTypes.reduce(
    (acc, widget) => {
      const category = widget.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(widget);
      return acc;
    },
    {} as Record<string, CategorizedWidget[]>
  );

  // Sort categories alphabetically
  const sortedCategories = Object.keys(widgetsByCategory).sort();

  // Filter widgets based on search query and selected category
  const filteredWidgetsByCategory = useMemo(() => {
    let filtered = availableWidgetTypes;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (widget) =>
          widget.title.toLowerCase().includes(query) ||
          widget.description.toLowerCase().includes(query) ||
          widget.type.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        (widget) => widget.category === selectedCategory
      );
    }

    // Group filtered widgets by category
    const groupedFiltered = filtered.reduce(
      (acc, widget) => {
        const category = widget.category;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(widget);
        return acc;
      },
      {} as Record<string, CategorizedWidget[]>
    );

    return groupedFiltered;
  }, [availableWidgetTypes, searchQuery, selectedCategory]);

  // Get filtered categories
  const filteredCategories = Object.keys(filteredWidgetsByCategory).sort();

  const handleAddWidget = (widgetType: CategorizedWidget) => {
    onAddWidget(widgetType, registry === 'navigation');
    setIsOpen(false);
    setSearchQuery('');
    setSelectedCategory('all');
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery('');
    setSelectedCategory('all');
  };

  // Button content based on variant
  const buttonContent = children || (
    <div className="flex items-center gap-xs">
      <Plus className="h-4 w-4" />
      <span>Add Widget</span>
    </div>
  );

  const buttonClass =
    variant === 'dashed'
      ? `border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 bg-transparent hover:bg-muted/20 transition-colors ${className}`
      : `${className}`;

  return (
    <>
      <Button
        variant={variant === 'dashed' ? 'ghost' : 'outline'}
        onClick={() => setIsOpen(true)}
        className={buttonClass}
      >
        {buttonContent}
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="w-full sm:max-w-2xl lg:max-w-3xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              Add{' '}
              {registry === 'navigation'
                ? 'Navigation'
                : registry.charAt(0).toUpperCase() + registry.slice(1)}{' '}
              Widget
            </DialogTitle>
            <DialogDescription>
              Choose a widget to add to your{' '}
              {registry === 'navigation'
                ? 'navigation area'
                : registry + ' dashboard'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-md overflow-hidden flex flex-col">
            {/* Filter Controls */}
            <div className="flex gap-xs">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search widgets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Category Filter */}
              <div className="w-48">
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {sortedCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category} ({widgetsByCategory[category].length})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Clear filters button */}
              {(searchQuery.trim() || selectedCategory !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Clear
                </Button>
              )}
            </div>

            {/* Widget Grid */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-md">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((category) => (
                    <div key={category} className="space-y-xs">
                      <h5 className="text-sm font-medium text-muted-foreground uppercase tracking-wide px-1">
                        {category}
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-xs">
                        {filteredWidgetsByCategory[category].map(
                          (widgetType) => (
                            <button
                              key={widgetType.type}
                              onClick={() => handleAddWidget(widgetType)}
                              className="text-left p-sm rounded-md border border-border bg-card hover:bg-accent transition-colors group"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0 pr-3">
                                  <div className="font-medium text-sm text-card-foreground mb-1">
                                    {widgetType.title}
                                  </div>
                                  {widgetType.description && (
                                    <div className="text-xs text-muted-foreground">
                                      {widgetType.description}
                                    </div>
                                  )}
                                </div>
                                <Plus className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                              </div>
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery.trim() || selectedCategory !== 'all'
                      ? 'No widgets match your filters'
                      : 'No widgets available'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddWidgetButton;
