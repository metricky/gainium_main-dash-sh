import { buildBotEditRoute } from '@/utils/bots/navigation';
import { CheckCircle, Edit, ExternalLink, Play, Sparkles } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import logger from '../../lib/loggerInstance';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

export interface SuccessFeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'clone' | 'create' | 'update' | 'delete' | 'import';
  itemName: string;
  itemType: 'bot' | 'deal' | 'preset' | 'settings';
  newItemId?: string | undefined;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'default' | 'outline' | 'secondary';
    icon?: React.ReactNode;
  }>;
  details?:
    | {
        originalName?: string;
        newName?: string;
        itemCount?: number;
        duration?: string;
        botTypeId?: string;
      }
    | undefined;
}

export const SuccessFeedbackModal: React.FC<SuccessFeedbackModalProps> = ({
  open,
  onOpenChange,
  type,
  itemName,
  itemType,
  newItemId,
  actions = [],
  details,
}) => {
  const navigate = useNavigate();

  // Get success message based on type
  const getSuccessMessage = () => {
    switch (type) {
      case 'clone':
        return `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} cloned successfully!`;
      case 'create':
        return `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} created successfully!`;
      case 'update':
        return `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} updated successfully!`;
      case 'delete':
        return `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} deleted successfully!`;
      case 'import':
        return `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} imported successfully!`;
      default:
        return 'Operation completed successfully!';
    }
  };

  // Get description based on type
  const getDescription = () => {
    switch (type) {
      case 'clone':
        return `A copy of "${details?.originalName || itemName}" has been created. You can now customize the cloned ${itemType} or start using it immediately.`;
      case 'create':
        return `Your new ${itemType} "${itemName}" is ready to use.`;
      case 'update':
        return `All changes to "${itemName}" have been saved successfully.`;
      case 'delete':
        return `"${itemName}" has been permanently removed from your account.`;
      case 'import':
        return `Settings have been imported and applied to "${itemName}".`;
      default:
        return `The operation on "${itemName}" completed successfully.`;
    }
  };

  // Default actions based on type and item
  const getDefaultActions = () => {
    const defaultActions = [];

    if (type === 'clone' || type === 'create') {
      // Edit action
      if (newItemId) {
        const editRoute = buildBotEditRoute(details?.botTypeId, newItemId);

        defaultActions.push({
          label: `Edit ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`,
          action: () => {
            navigate(editRoute);
            onOpenChange(false);
          },
          variant: 'outline' as const,
          icon: <Edit className="w-4 h-4" />,
        });

        // View details action
        defaultActions.push({
          label: 'View Details',
          action: () => {
            navigate(`/bot/view/${newItemId}`);
            onOpenChange(false);
          },
          variant: 'outline' as const,
          icon: <ExternalLink className="w-4 h-4" />,
        });
      }

      // Start bot action (for bots only)
      if (itemType === 'bot') {
        defaultActions.push({
          label: 'Start Bot',
          action: () => {
            // TODO: Implement start bot action
            logger.info('[SuccessFeedbackModal] Starting bot', newItemId);
            onOpenChange(false);
          },
          variant: 'default' as const,
          icon: <Play className="w-4 h-4" />,
        });
      }
    }

    return defaultActions;
  };

  const allActions = actions.length > 0 ? actions : getDefaultActions();

  // Auto-close after delay for certain types
  React.useEffect(() => {
    if (open && (type === 'update' || type === 'delete')) {
      const timer = setTimeout(() => {
        onOpenChange(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [open, type, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-xs text-base sm:text-lg">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            {getSuccessMessage()}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 space-y-md sm:space-y-5">
          {/* Success Animation */}
          <div className="flex justify-center py-4">
            <div className="relative">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1">
                <Sparkles className="w-6 h-6 text-yellow-500 animate-bounce" />
              </div>
            </div>
          </div>

          {/* Item Details */}
          <Card className="p-sm bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <div className="space-y-xs">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-700 dark:text-green-300">
                  {itemType.charAt(0).toUpperCase() + itemType.slice(1)} Name:
                </span>
                <span className="font-medium text-green-900 dark:text-green-100">
                  {details?.newName || itemName}
                </span>
              </div>

              {details?.originalName && type === 'clone' && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700 dark:text-green-300">
                    Cloned From:
                  </span>
                  <span className="text-sm text-green-800 dark:text-green-200">
                    {details.originalName}
                  </span>
                </div>
              )}

              {newItemId && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700 dark:text-green-300">
                    ID:
                  </span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {newItemId.slice(-8)}
                  </Badge>
                </div>
              )}

              {details?.itemCount && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700 dark:text-green-300">
                    Items:
                  </span>
                  <span className="font-medium text-green-900 dark:text-green-100">
                    {details.itemCount}
                  </span>
                </div>
              )}

              {details?.duration && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700 dark:text-green-300">
                    Duration:
                  </span>
                  <span className="font-medium text-green-900 dark:text-green-100">
                    {details.duration}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {allActions.length > 0 && (
          <DialogFooter className="flex-col sm:flex-row gap-sm">
            {allActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant === 'default' ? 'default' : 'outline'}
                size="sm"
                onClick={action.action}
                className="w-full sm:w-auto text-sm"
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SuccessFeedbackModal;
