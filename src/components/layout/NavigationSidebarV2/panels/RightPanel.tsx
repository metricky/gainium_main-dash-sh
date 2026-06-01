import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import React from 'react';

interface RightPanelProps {
  title: string;
  pinned?: boolean;
  onClose?: () => void;
  onPinToggle?: () => void;
  headerActions?: React.ReactNode;
  children?: React.ReactNode;
}

const RightPanel: React.FC<RightPanelProps> = ({
  title,
  pinned,
  onClose,
  onPinToggle,
  headerActions,
  children,
}) => {
  return (
    <div className="w-72 bg-card h-full flex flex-col rounded-lg border border-border">
      <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-card-foreground">{title}</h2>
        <div className="flex items-center gap-2">
          {onPinToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onPinToggle}
              className={`h-8 w-8 p-0 text-muted-foreground hover:text-card-foreground hover:bg-muted/50 ${pinned ? 'bg-muted/50' : ''}`}
              title={pinned ? 'Unpin panel' : 'Pin panel'}
            >
              {pinned ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
          {onClose && !pinned && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-card-foreground hover:bg-muted/50"
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {headerActions}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
};

export default RightPanel;
