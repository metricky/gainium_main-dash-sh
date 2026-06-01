import { Plus, Search, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';
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
import { getWidgetIcon } from './widgetIconsRegistry';

interface CategorizedWidget {
  type: string;
  title: string;
  description: string;
  category: string;
  defaultSize: { w: number; h: number };
  hasOptions: boolean;
}

interface WidgetBrowserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  availableWidgets: CategorizedWidget[];
  onWidgetSelect: (
    widget: CategorizedWidget,
    isNavigationWidget?: boolean
  ) => void;
  isNavigationSection?: boolean;
  existingWidgets?: Array<{ type: string }>;
}

const WidgetBrowserDialog: React.FC<WidgetBrowserDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  availableWidgets,
  onWidgetSelect,
  isNavigationSection = false,
  existingWidgets = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Get existing widget types for navigation widgets (to show as disabled)
  const existingWidgetTypes = useMemo(() => {
    return new Set(existingWidgets.map((w) => w.type));
  }, [existingWidgets]);

  // Group widgets by category
  const widgetsByCategory = useMemo(() => {
    return availableWidgets.reduce(
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
  }, [availableWidgets]);

  // Sort categories alphabetically
  const sortedCategories = Object.keys(widgetsByCategory).sort();

  // Filter widgets based on search query and selected category
  const filteredWidgets = useMemo(() => {
    let filtered = availableWidgets;

    // Exclude overview and onboarding widgets
    filtered = filtered.filter(
      (widget) =>
        widget.type !== 'overview-quick-actions' &&
        widget.type !== 'onboarding-steps'
    );

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

    return filtered;
  }, [availableWidgets, searchQuery, selectedCategory]);

  const handleWidgetSelect = (widget: CategorizedWidget) => {
    onWidgetSelect(widget, isNavigationSection);
    onOpenChange(false);
    // Reset filters
    setSearchQuery('');
    setSelectedCategory('all');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {/* Filter Controls */}
          <div className="shrink-0 bg-inner-container border-2 border-border rounded-md p-sm mb-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Browse Widgets
              </h5>
              {/* Clear filters button */}
              {(searchQuery.trim() || selectedCategory !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
                  title="Clear filters"
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              )}
            </div>

            {/* Filter Controls Row */}
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
              <div className="flex-1">
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-full">
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
            </div>
          </div>

          {/* Widgets Grid */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
            {filteredWidgets.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-sm">
                {filteredWidgets.map((widgetType) => {
                  const isDisabled =
                    isNavigationSection &&
                    existingWidgetTypes.has(widgetType.type);
                  const IconComponent = getWidgetIcon(widgetType.type);

                  return (
                    <button
                      key={widgetType.type}
                      onClick={() =>
                        !isDisabled && handleWidgetSelect(widgetType)
                      }
                      disabled={isDisabled}
                      className={`relative flex flex-col rounded-lg border-2 shadow-sm touch-manipulation transition-all duration-200 overflow-hidden ${
                        isDisabled
                          ? 'border-border bg-muted/30 cursor-not-allowed opacity-50'
                          : 'border-border bg-inner-container hover:border-primary hover:shadow-md hover:shadow-primary/10 group'
                      }`}
                    >
                      {/* SVG Icon Container */}
                      <div
                        className={`aspect-square w-full flex items-center justify-center p-sm ${
                          isDisabled
                            ? 'opacity-50'
                            : 'group-hover:scale-105 transition-transform duration-200'
                        }`}
                      >
                        <IconComponent className="w-full h-full" />
                      </div>

                      {/* Widget Info */}
                      <div className="p-xs flex flex-col items-center gap-1">
                        <div className="font-medium text-xs text-card-foreground text-center truncate w-full">
                          {widgetType.title}
                        </div>
                        {/* Category Chip */}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {widgetType.category}
                        </span>
                        {widgetType.description && (
                          <div className="text-xs text-muted-foreground text-center line-clamp-2 leading-tight opacity-70">
                            {widgetType.description}
                          </div>
                        )}
                      </div>

                      {/* Add indicator overlay */}
                      {!isDisabled && (
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/0 group-hover:bg-primary/10 transition-colors duration-200">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-primary rounded-full p-1.5 shadow-lg">
                            <Plus className="h-4 w-4 text-primary-foreground" />
                          </div>
                        </div>
                      )}

                      {/* Already added badge */}
                      {isDisabled && (
                        <div className="absolute top-1 right-1 text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                          Added
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">
                {searchQuery.trim() || selectedCategory !== 'all'
                  ? 'No widgets match your filters'
                  : 'No widgets available'}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WidgetBrowserDialog;
