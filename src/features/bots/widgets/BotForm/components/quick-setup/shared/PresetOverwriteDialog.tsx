import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface PresetOverwriteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Human label shown in the description + confirm button (preset or template name). */
  pendingLabel: string;
  onConfirm: () => void;
}

/**
 * Confirmation dialog shown when the user picks a different preset or
 * template after diverging from the current one. Wraps the generic
 * ConfirmationDialog with copy specific to Quick Setup overwrites.
 */
export const PresetOverwriteDialog: React.FC<PresetOverwriteDialogProps> = ({
  open,
  onOpenChange,
  pendingLabel,
  onConfirm,
}) => {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Overwrite current settings?"
      description={`Switching to "${pendingLabel}" will reset all DCA settings to the new configuration.`}
      confirmText={`Apply ${pendingLabel}`}
      cancelText="Keep my settings"
      onConfirm={onConfirm}
    />
  );
};
