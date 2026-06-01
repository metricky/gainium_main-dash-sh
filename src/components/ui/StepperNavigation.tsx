import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';
import { cn } from '../../lib/utils';

export interface StepperTab {
  id: string;
  label: string;
  completed?: boolean;
}

interface StepperNavigationProps {
  tabs: StepperTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

/**
 * Stepper navigation component that shows progress through tabs
 * with step-by-step navigation controls
 */
export const StepperNavigation: React.FC<StepperNavigationProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className,
}) => {
  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);
  const canGoPrevious = activeIndex > 0;
  const canGoNext = activeIndex < tabs.length - 1;

  const handlePrevious = () => {
    if (canGoPrevious) {
      onTabChange(tabs[activeIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      onTabChange(tabs[activeIndex + 1].id);
    }
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 md:p-4 border-t border-border bg-muted/30',
        className
      )}
    >
      {/* Previous button */}
      <button
        type="button"
        onClick={handlePrevious}
        disabled={!canGoPrevious}
        className={cn(
          'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
          canGoPrevious
            ? 'text-foreground hover:bg-muted border border-border'
            : 'text-muted-foreground cursor-not-allowed opacity-50'
        )}
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Previous</span>
      </button>

      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTab;
          const isCompleted = tab.completed || index < activeIndex;
          const isClickable = index <= activeIndex + 1; // Allow clicking current and next step

          return (
            <React.Fragment key={tab.id}>
              <button
                type="button"
                onClick={() => isClickable && onTabChange(tab.id)}
                disabled={!isClickable}
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary text-white border-2 border-primary'
                    : isCompleted
                      ? 'bg-green-500 text-white border-2 border-green-500'
                      : isClickable
                        ? 'bg-muted text-muted-foreground border-2 border-muted-foreground hover:border-primary hover:text-primary'
                        : 'bg-muted/50 text-muted-foreground/50 border-2 border-muted-foreground/50 cursor-not-allowed'
                )}
                title={tab.label}
              >
                {isCompleted && !isActive ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </button>

              {/* Connector line */}
              {index < tabs.length - 1 && (
                <div
                  className={cn(
                    'w-8 h-0.5 transition-colors duration-200',
                    index < activeIndex
                      ? 'bg-green-500'
                      : 'bg-muted-foreground/30'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Next button */}
      <button
        type="button"
        onClick={handleNext}
        disabled={!canGoNext}
        className={cn(
          'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
          canGoNext
            ? 'text-foreground hover:bg-muted border border-border'
            : 'text-muted-foreground cursor-not-allowed opacity-50'
        )}
      >
        <span>Next</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default StepperNavigation;
