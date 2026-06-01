import { Activity, Play, Square } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '../../../../../../components/ui/button';
import { Card } from '../../../../../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../../../components/ui/dialog';
import { Label } from '../../../../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../../../components/ui/select';

export interface BotStatusConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (closeType?: string) => void;
  botName: string;
  currentStatus: 'active' | 'stopped' | 'error' | 'paused';
  targetStatus: 'active' | 'stopped';
  hasActiveDeals: boolean;
  isLoading?: boolean;
}

export default function BotStatusConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  botName,
  currentStatus,
  targetStatus,
  hasActiveDeals,
  isLoading = false,
}: BotStatusConfirmationModalProps) {
  const [closeType, setCloseType] = useState<string>('leave');

  // Reset closeType when modal opens/closes
  React.useEffect(() => {
    if (!open) {
      setCloseType('leave');
    }
  }, [open]);

  const isStarting = targetStatus === 'active';
  const isStopping = targetStatus === 'stopped';

  const handleConfirm = () => {
    if (isStopping && hasActiveDeals) {
      onConfirm(closeType);
    } else {
      onConfirm();
    }
  };

  const getTitle = () => {
    if (isStarting) {
      return 'Start the bot';
    } else {
      return 'Stop the bot';
    }
  };

  const getDescription = () => {
    if (isStarting) {
      return `Are you sure you want to start "${botName}"?`;
    } else {
      return `Are you sure you want to stop "${botName}"?`;
    }
  };

  const getButtonText = () => {
    if (isStarting) {
      return 'Start Bot';
    } else {
      return 'Stop Bot';
    }
  };

  const getButtonIcon = () => {
    if (isStarting) {
      return <Play className="w-4 h-4 mr-2" />;
    } else {
      return <Square className="w-4 h-4 mr-2" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-xs text-base sm:text-lg">
            <Activity className="w-5 h-5 text-white" />
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 space-y-md sm:space-y-5">
          {/* Bot Information */}
          <Card className="p-sm bg-muted/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Bot Name:</span>
              <span className="font-medium text-sm">{botName}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-muted-foreground">
                Current Status:
              </span>
              <span
                className={`text-sm font-medium capitalize ${
                  currentStatus === 'active'
                    ? 'text-success'
                    : 'text-muted-foreground'
                }`}
              >
                {currentStatus}
              </span>
            </div>
          </Card>

          {/* Close Type Selection */}
          {isStopping && hasActiveDeals && (
            <div className="space-y-sm pb-2">
              <Label className="text-sm font-medium">
                How do you want to handle active deals?
              </Label>
              <Select value={closeType} onValueChange={setCloseType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select close type" />
                </SelectTrigger>
                <SelectContent className="z-[70]">
                  <SelectItem value="leave">Leave deals open</SelectItem>
                  <SelectItem value="cancel">Cancel all deals</SelectItem>
                  <SelectItem value="closeByLimit">Close by LIMIT</SelectItem>
                  <SelectItem value="closeByMarket">Close by MARKET</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-sm">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full sm:w-auto text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`w-full sm:w-auto text-sm ${
              isStarting
                ? 'bg-success hover:bg-success/90 text-white'
                : 'bg-warning hover:bg-warning/90 text-white'
            }`}
            autoFocus
          >
            {isLoading ? (
              <>
                <div className="w-3 h-3 sm:w-4 sm:h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isStarting ? 'Starting...' : 'Stopping...'}
              </>
            ) : (
              <>
                {getButtonIcon()}
                {getButtonText()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
