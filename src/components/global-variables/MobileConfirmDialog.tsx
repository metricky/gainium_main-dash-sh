/**
 * MobileConfirmDialog Component
 *
 * A mobile-optimized confirmation dialog that provides better UX
 * on touch devices with larger touch targets and clearer messaging.
 */

import React from 'react';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface MobileConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  additionalInfo?: {
    variableName?: string;
    selectedCount?: number;
    warningMessage?: string;
  };
}

const MobileConfirmDialog: React.FC<MobileConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  additionalInfo,
}) => {
  // Build enhanced description with additional info
  let enhancedDescription = description;

  if (additionalInfo) {
    if (additionalInfo.variableName) {
      enhancedDescription += `\n\nVariable: ${additionalInfo.variableName}`;
    }
    if (additionalInfo.selectedCount && additionalInfo.selectedCount > 0) {
      enhancedDescription += `\n\nSelected: ${additionalInfo.selectedCount} variable${additionalInfo.selectedCount !== 1 ? 's' : ''}`;
    }
    if (additionalInfo.warningMessage) {
      enhancedDescription += `\n\n⚠️ ${additionalInfo.warningMessage}`;
    }
  }

  return (
    <ConfirmationDialog
      open={isOpen}
      onOpenChange={onClose}
      title={title}
      description={enhancedDescription}
      confirmText={confirmText}
      cancelText={cancelText}
      variant={isDestructive ? 'destructive' : 'default'}
      onConfirm={onConfirm}
      onCancel={onClose}
    />
  );
};

export default MobileConfirmDialog;
