import type { BotFormData } from '@/types/bots/form';
import type { BotFormUpdateValue, Fields } from '@/features/bots';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

export interface TabContentProps {
  formData: BotFormData;
  updateFormData: (field: Fields, value: BotFormUpdateValue) => void;
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  content: React.ComponentType<TabContentProps>;
  description?: string;
}

interface ResponsiveTabNavigationProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

/**
 * Responsive tab navigation that adapts to widget/container size:
 * - Large widgets (>800px): Show all tabs horizontally
 * - Medium widgets (500-800px): Horizontal scroll with overflow indicator
 * - Small widgets (<500px): Dropdown menu with current tab shown
 */
export const ResponsiveTabNavigation: React.FC<
  ResponsiveTabNavigationProps
> = ({ tabs, activeTab, onTabChange, className }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  // Check scroll position and update indicators
  const checkScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1); // -1 for rounding errors
    }
  }, []);

  // Handle scroll events
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      // Initial check
      checkScrollPosition();
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
    return () => {}; // Return empty cleanup function when container is not available
  }, [checkScrollPosition]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }

    return () => {}; // Return empty cleanup function for non-open state
  }, [isDropdownOpen]);

  // Handle wheel events to prevent page scrolling when scrolling tabs
  useEffect(() => {
    const container = scrollContainerRef.current?.parentElement; // Get the parent div
    if (container) {
      const handleWheel = (e: WheelEvent) => {
        // Prevent default page scrolling
        e.preventDefault();
        e.stopPropagation();

        // Handle horizontal scrolling
        const scrollContainer = scrollContainerRef.current;
        if (scrollContainer) {
          scrollContainer.scrollBy({ left: e.deltaY, behavior: 'smooth' });
        }
      };

      // Add event listener in capture phase to ensure it's handled before bubbling
      container.addEventListener('wheel', handleWheel, {
        passive: false,
        capture: true,
      });

      return () => {
        container.removeEventListener('wheel', handleWheel, { capture: true });
      };
    }
    return () => {};
  }, []);

  return (
    <div className={cn('@container w-full', className)}>
      {/* Large widgets: Show all tabs horizontally */}
      <div className="@[800px]:block hidden">
        <div className="flex border-b border-border">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'px-4 py-3 text-sm font-medium transition-all duration-200 flex items-center gap-2 border-b-2 min-h-12',
                  activeTab === tab.id
                    ? 'text-primary border-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Medium widgets: Horizontal scroll with overflow */}
      <div className="@[500px]:block @[800px]:hidden hidden">
        <div className="relative">
          {/* Left scroll arrow */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => {
                const container = scrollContainerRef.current;
                if (container) {
                  container.scrollBy({ left: -100, behavior: 'smooth' });
                }
              }}
              className="absolute left-0 top-1/4 -translate-y-1/4 h-10 w-8 bg-linear-to-r from-background/95 via-background/60 to-transparent backdrop-blur-sm border-r border-border/30 flex items-center justify-center hover:from-background/98 hover:via-background/75 transition-all duration-200 z-20 cursor-pointer"
              aria-label="Scroll tabs left"
            >
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
          )}

          {/* Right scroll arrow */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => {
                const container = scrollContainerRef.current;
                if (container) {
                  container.scrollBy({ left: 100, behavior: 'smooth' });
                }
              }}
              className="absolute right-0 top-1/4 -translate-y-1/4 h-10 w-8 bg-linear-to-r from-transparent via-background/60 to-background/95 backdrop-blur-sm border-l border-border/30 flex items-center justify-center hover:via-background/75 hover:to-background/98 transition-all duration-200 z-20 cursor-pointer"
              aria-label="Scroll tabs right"
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          )}

          <div
            ref={scrollContainerRef}
            className="flex border-b border-border overflow-x-auto custom-scrollbar scroll-smooth"
            style={{ scrollbarWidth: 'thin' }}
          >
            <div className="flex">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onTabChange(tab.id)}
                    className={cn(
                      'px-3 py-3 text-sm font-medium transition-all duration-200 flex items-center gap-2 border-b-2 min-h-12 whitespace-nowrap shrink-0',
                      activeTab === tab.id
                        ? 'text-primary border-primary bg-primary/5'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border-transparent'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Small widgets: Dropdown menu */}
      <div className="@[500px]:hidden block">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full px-4 py-3 text-sm font-medium transition-all duration-200 flex items-center justify-between border-b border-border min-h-12 bg-background hover:bg-muted/50 rounded-t-lg"
            aria-expanded={isDropdownOpen}
            aria-haspopup="listbox"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {activeTabData && (
                <>
                  <activeTabData.icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{activeTabData.label}</span>
                </>
              )}
            </div>
            <ChevronDown
              className={cn(
                'w-4 h-4 transition-transform duration-200 shrink-0 ml-2',
                isDropdownOpen ? 'rotate-180' : ''
              )}
            />
          </button>

          {isDropdownOpen && (
            <div
              className="absolute top-full left-0 right-0 z-50 bg-background border border-border rounded-b-lg shadow-lg max-h-60 overflow-y-auto"
              role="listbox"
              aria-label="Tab selection"
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      onTabChange(tab.id);
                      setIsDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full px-4 py-3 text-sm font-medium transition-all duration-200 flex items-center gap-2 hover:bg-muted/50 min-h-11 text-left',
                      activeTab === tab.id
                        ? 'text-primary bg-primary/5'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    role="option"
                    aria-selected={activeTab === tab.id}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResponsiveTabNavigation;
