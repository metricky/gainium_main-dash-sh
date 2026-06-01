import { Activity, Play, Square } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { StatusChip } from '../ui/chip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import type { BotStatus } from '@/types';

export interface BotStatusConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (closeType?: string) => void;
  botName: string;
  currentStatus: BotStatus;
  targetStatus: BotStatus;
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

  const isStarting = targetStatus === 'open';
  const isStopping = targetStatus === 'closed';

  const handleConfirm = () => {
    if (isStopping && hasActiveDeals) {
      onConfirm(closeType);
    } else {
      onConfirm();
    }
  };

  const getCloseOptionDescription = (option: string) => {
    switch (option) {
      case 'leave':
        return 'Bot stops but deals remain active and can be managed manually';
      case 'cancel':
        return 'All active deals are immediately canceled without executing any orders';
      case 'closeByLimit':
        return 'Place LIMIT orders to close all deals at current take profit levels';
      case 'closeByMarket':
        return 'Place MARKET orders to close all deals immediately at current market price';
      default:
        return '';
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
          <div className="space-y-xs">
            <div className="flex items-center gap-xs">
              <span className="text-sm font-medium">{botName}</span>
              <span className="text-muted-foreground">·</span>
              <StatusChip status={currentStatus} size="xs" chipStyle="soft" />
            </div>
          </div>

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
                <SelectContent className="z-70">
                  <SelectItem value="leave">Leave deals open</SelectItem>
                  <SelectItem value="cancel">Cancel all deals</SelectItem>
                  <SelectItem value="closeByLimit">Close by LIMIT</SelectItem>
                  <SelectItem value="closeByMarket">Close by MARKET</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {getCloseOptionDescription(closeType)}
              </p>
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
            variant="default"
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto text-sm"
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
