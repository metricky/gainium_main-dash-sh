import { AlertTriangle } from 'lucide-react';
import React from 'react';
import { logger } from '@/lib/loggerInstance';
import type { ExchangeInUser } from '../../types/exchange.types';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

interface DeleteExchangeDialogProps {
  open: boolean;
  exchange: ExchangeInUser | null;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

const DeleteExchangeDialog: React.FC<DeleteExchangeDialogProps> = ({
  open,
  exchange,
  onConfirm,
  onCancel,
  isDeleting = false,
}) => {
  logger.info('[delete-exchange] DeleteExchangeDialog render', {
    open,
    exchange,
    isDeleting,
  });

  if (!exchange) {
    logger.warn(
      '[delete-exchange] DeleteExchangeDialog - No exchange provided, returning null'
    );
    return null;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        logger.info(
          '[delete-exchange] DeleteExchangeDialog onOpenChange called',
          { isOpen }
        );
        if (!isOpen) {
          onCancel();
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-xs text-destructive">
            <AlertTriangle className="w-5 h-5 text-white" />
            Delete Exchange
          </DialogTitle>
          <DialogDescription className="text-left">
            Are you sure you want to delete the exchange{' '}
            <strong>"{exchange.name}"</strong>?
            <br />
            <br />
            This action cannot be undone and will:
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>Remove all exchange configuration</li>
              <li>Stop all active bots using this exchange</li>
              <li>Clear all associated trading history</li>
            </ul>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-xs">
          <Button
            variant="outline"
            onClick={() => {
              logger.info(
                '[delete-exchange] DeleteExchangeDialog Cancel button clicked'
              );
              onCancel();
            }}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              logger.info(
                '[delete-exchange] DeleteExchangeDialog Confirm button clicked'
              );
              onConfirm();
            }}
            disabled={isDeleting}
            autoFocus
          >
            {isDeleting ? 'Deleting...' : 'Delete Exchange'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteExchangeDialog;
