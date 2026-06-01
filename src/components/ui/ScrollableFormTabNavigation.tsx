import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

export interface ScrollableTabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  disabled?: boolean;
}

interface ScrollableFormTabNavigationProps {
  tabs: ScrollableTabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

/**
 * Responsive tab navigation that:
 * - Displays tabs at the top (sticky)
 * - Scrolls to the corresponding section when a tab is clicked
 * - Auto-highlights tabs as user scrolls through sections
 * - Adapts to different screen sizes with horizontal scrolling on smaller screens
 */
export const ScrollableFormTabNavigation: React.FC<
  ScrollableFormTabNavigationProps
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
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, []);

  // Handle scroll events for tab container
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      checkScrollPosition();
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
    return () => {};
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

    return () => {};
  }, [isDropdownOpen]);

  // Handle wheel events for horizontal scrolling
  useEffect(() => {
    const container = scrollContainerRef.current?.parentElement;
    if (container) {
      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const scrollContainer = scrollContainerRef.current;
        if (scrollContainer) {
          scrollContainer.scrollBy({ left: e.deltaY, behavior: 'smooth' });
        }
      };

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
      {/* Large screens: Show all tabs horizontally */}
      <div className="@[800px]:block hidden">
        <div className="flex gap-xs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                data-tour={`botForm.tab.${tab.id}`}
                onClick={() => {
                  if (tab.disabled) return;
                  onTabChange(tab.id);
                }}
                className={cn(
                  'relative px-3 py-1.5 text-sm font-medium transition-colors duration-200 flex items-center gap-2 rounded-md border min-h-9',
                  activeTab === tab.id
                    ? 'text-primary border-primary/60 bg-primary/10'
                    : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50',
                  tab.disabled ? 'opacity-60 pointer-events-none' : ''
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Medium screens: Horizontal scroll with overflow indicators */}
      <div className="@[500px]:block @[800px]:hidden hidden">
        <div className="relative">
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
            className="flex overflow-x-auto custom-scrollbar scroll-smooth"
            style={{ scrollbarWidth: 'thin' }}
          >
            <div className="flex gap-xs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      if (tab.disabled) return;
                      onTabChange(tab.id);
                    }}
                    className={cn(
                      'relative px-3 py-1.5 text-sm font-medium transition-colors duration-200 flex items-center gap-2 rounded-md border min-h-9 whitespace-nowrap shrink-0',
                      activeTab === tab.id
                        ? 'text-primary border-primary/60 bg-primary/10'
                        : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50',
                      tab.disabled ? 'opacity-60 pointer-events-none' : ''
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

      {/* Small screens: Dropdown menu */}
      <div className="@[500px]:hidden block">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full px-3 py-1.5 text-sm font-medium transition-all duration-200 flex items-center justify-between border-0 bg-transparent hover:bg-muted/50 rounded-md"
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
                      if (tab.disabled) return;
                      onTabChange(tab.id);
                      setIsDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full px-4 py-3 text-sm font-medium transition-all duration-200 flex items-center gap-2 hover:bg-muted/50 min-h-11 text-left',
                      activeTab === tab.id
                        ? 'text-primary bg-primary/10 rounded-md'
                        : 'text-muted-foreground hover:text-foreground',
                      tab.disabled ? 'opacity-60 pointer-events-none' : ''
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

export default ScrollableFormTabNavigation;
