import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';

interface CelebrationAction {
  label: string;
  onClick?: () => void;
  variant?: 'default' | 'outline';
}

interface CelebrationProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  primaryAction?: CelebrationAction;
  secondaryAction?: CelebrationAction;
}

const Celebration: React.FC<CelebrationProps> = ({
  open,
  onClose,
  title = '🎉 Done!',
  description,
  primaryAction,
  secondaryAction,
}) => {
  const [confettiSize, setConfettiSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (!open) return;
    const onResize = () => {
      setConfettiSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [open]);

  const handleAction = (action?: CelebrationAction) => {
    action?.onClick?.();
    onClose();
  };

  return (
    <>
      {open && (
        <div className="pointer-events-none fixed inset-0 z-[60]">
          <Confetti
            width={confettiSize.width}
            height={confettiSize.height}
            numberOfPieces={180}
            recycle={false}
            tweenDuration={5000}
          />
        </div>
      )}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) onClose();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">{title}</DialogTitle>
            {description && (
              <DialogDescription className="text-center pt-2">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-sm">
            {secondaryAction && (
              <Button
                type="button"
                variant={secondaryAction.variant ?? 'outline'}
                onClick={() => handleAction(secondaryAction)}
              >
                {secondaryAction.label}
              </Button>
            )}
            {primaryAction && (
              <Button
                type="button"
                variant={primaryAction.variant ?? 'default'}
                onClick={() => handleAction(primaryAction)}
              >
                {primaryAction.label}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { Celebration };
export type { CelebrationProps };
