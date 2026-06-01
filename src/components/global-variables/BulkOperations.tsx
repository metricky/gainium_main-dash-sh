/**
 * BulkOperations Component
 *
 * A comprehensive component for performing bulk operations on global variables:
 * - Bulk delete with safety checks
 * - Bulk export in multiple formats
 * - Bulk edit capabilities
 * - Operation progress tracking
 */

import React, { useState, useCallback } from 'react';
import {
  Trash2,
  Download,
  FileText,
  AlertTriangle,
  CheckCircle,
  Loader2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import type { GlobalVariable } from '@/types/globalVariables';
import { toast } from '@/lib/toast';
import { logger } from '@/lib/loggerInstance';

interface BulkOperationsProps {
  selectedVariables: GlobalVariable[];
  onClearSelection: () => void;
  onBulkDelete: (variableIds: string[]) => Promise<void>;
  onBulkExport: (variables: GlobalVariable[], format: 'json' | 'csv') => void;
  isDeleteLoading?: boolean;
  className?: string;
}

interface OperationProgress {
  total: number;
  completed: number;
  failed: number;
  isRunning: boolean;
  errors: Array<{ id: string; name: string; error: string }>;
}

const BulkOperations: React.FC<BulkOperationsProps> = ({
  selectedVariables,
  onClearSelection,
  onBulkDelete,
  onBulkExport,
  isDeleteLoading = false,
  className = '',
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [operationProgress, setOperationProgress] = useState<OperationProgress>(
    {
      total: 0,
      completed: 0,
      failed: 0,
      isRunning: false,
      errors: [],
    }
  );

  // Calculate operation statistics
  const selectedCount = selectedVariables.length;
  const deletableCount = selectedVariables.filter(
    (v) => v.botAmount === 0
  ).length;
  const nonDeletableCount = selectedCount - deletableCount;
  const canDelete = deletableCount > 0;

  // Handle bulk delete confirmation
  const handleDeleteConfirm = useCallback(async () => {
    if (!canDelete) return;

    const deletableVariables = selectedVariables.filter(
      (v) => v.botAmount === 0
    );

    try {
      setShowDeleteDialog(false);
      setOperationProgress({
        total: deletableVariables.length,
        completed: 0,
        failed: 0,
        isRunning: true,
        errors: [],
      });
      setShowProgressDialog(true);

      await onBulkDelete(deletableVariables.map((v) => v.id));

      setOperationProgress((prev) => ({
        ...prev,
        completed: prev.total,
        isRunning: false,
      }));

      setTimeout(() => {
        setShowProgressDialog(false);
        onClearSelection();
      }, 2000);
    } catch (error) {
      logger.error('[BulkOperations] Delete failed', { error });
      setOperationProgress((prev) => ({
        ...prev,
        failed: prev.total - prev.completed,
        isRunning: false,
        errors: [{ id: 'bulk', name: 'Bulk Operation', error: String(error) }],
      }));
    }
  }, [canDelete, selectedVariables, onBulkDelete, onClearSelection]);

  // Handle export operations
  const handleExport = useCallback(
    (format: 'json' | 'csv') => {
      try {
        onBulkExport(selectedVariables, format);
        toast.success(
          `Exported ${selectedCount} variables as ${format.toUpperCase()}`
        );
      } catch (error) {
        logger.error('[BulkOperations] Export failed', { error, format });
        toast.error(`Failed to export variables: ${error}`);
      }
    },
    [selectedVariables, selectedCount, onBulkExport]
  );

  // Generate export filename

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <div
        className={`flex items-center gap-sm p-sm bg-muted/50 rounded-lg border ${className}`}
      >
        <div className="flex items-center gap-xs">
          <Badge variant="secondary" className="font-medium">
            {selectedCount} selected
          </Badge>
          {nonDeletableCount > 0 && (
            <Badge
              variant="outline"
              className="text-yellow-600 border-yellow-300"
            >
              {nonDeletableCount} in use
            </Badge>
          )}
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-xs">
          {/* Export Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-xs">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Export Format</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport('json')}>
                <FileText className="mr-2 h-4 w-4" />
                JSON Format
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileText className="mr-2 h-4 w-4" />
                CSV Format
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Delete Button */}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            disabled={!canDelete || isDeleteLoading}
            className="gap-xs"
          >
            {isDeleteLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete {deletableCount > 0 ? `(${deletableCount})` : ''}
          </Button>

          {/* Clear Selection */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="gap-xs"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-xs">
              <AlertTriangle className="h-5 w-5 text-white" />
              Confirm Bulk Delete
            </DialogTitle>
            <DialogDescription>
              You are about to delete {deletableCount} global variable
              {deletableCount !== 1 ? 's' : ''}. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-md">
            {/* Deletable Variables */}
            {deletableCount > 0 && (
              <div>
                <h4 className="font-medium text-sm text-green-700 mb-2">
                  Will be deleted ({deletableCount}):
                </h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {selectedVariables
                    .filter((v) => v.botAmount === 0)
                    .map((variable) => (
                      <div
                        key={variable.id}
                        className="flex items-center gap-xs p-xs bg-green-50 rounded text-sm"
                      >
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <code className="font-mono">{variable.name}</code>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Non-deletable Variables */}
            {nonDeletableCount > 0 && (
              <div>
                <h4 className="font-medium text-sm text-red-700 mb-2">
                  Cannot be deleted ({nonDeletableCount}):
                </h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {selectedVariables
                    .filter((v) => v.botAmount > 0)
                    .map((variable) => (
                      <div
                        key={variable.id}
                        className="flex items-center gap-xs p-xs bg-red-50 rounded text-sm"
                      >
                        <AlertTriangle className="h-3 w-3 text-red-600" />
                        <code className="font-mono">{variable.name}</code>
                        <Badge variant="outline" className="text-xs">
                          {variable.botAmount} bot
                          {variable.botAmount !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    ))}
                </div>
                <Alert className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Variables in use by active bots cannot be deleted. Stop or
                    modify the bots first.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={!canDelete}
            >
              Delete {deletableCount} Variable{deletableCount !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress Dialog */}
      <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {operationProgress.isRunning
                ? 'Deleting Variables...'
                : 'Operation Complete'}
            </DialogTitle>
            <DialogDescription>
              {operationProgress.isRunning
                ? 'Please wait while we delete the selected variables.'
                : 'The bulk delete operation has finished.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-md">
            <ProgressBar
              value={
                (operationProgress.completed / operationProgress.total) * 100
              }
              className="w-full"
              showPercentage={true}
            />

            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {operationProgress.completed} of {operationProgress.total}{' '}
                completed
              </span>
              <span>
                {operationProgress.failed > 0 &&
                  `${operationProgress.failed} failed`}
              </span>
            </div>

            {operationProgress.errors.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Some operations failed:</p>
                    {operationProgress.errors.map((error, index) => (
                      <p key={index} className="text-xs">
                        {error.name}: {error.error}
                      </p>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {!operationProgress.isRunning && (
            <DialogFooter>
              <Button onClick={() => setShowProgressDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BulkOperations;
