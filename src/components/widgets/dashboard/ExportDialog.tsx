// Export Dialog Component for Enhanced Balance Table
// Provides UI for selecting export format, columns, and options

import { Download, FileJson, FileSpreadsheet, FileText, X } from 'lucide-react';
import React, { useState } from 'react';
import type { EnhancedBalanceData } from '../../../types/enhancedBalance.types';
import {
  exportBalanceData,
  generateFilename,
  getAvailableColumns,
  validateExportOptions,
  type ExportFormat,
  type ExportOptions,
} from '../../../utils/exportUtils';
import { Button } from '../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { Input } from '../../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { Switch } from '../../ui/switch';
import { toast } from '@/lib/toast';

// Export Dialog Props
interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: EnhancedBalanceData[];
  totalRows: number;
}

// Export format options with icons
const EXPORT_FORMATS: Array<{
  value: ExportFormat;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    value: 'csv',
    label: 'CSV',
    description: 'Comma-separated values (Excel compatible)',
    icon: FileText,
  },
  {
    value: 'excel',
    label: 'Excel',
    description: 'Microsoft Excel format with formatting',
    icon: FileSpreadsheet,
  },
  {
    value: 'json',
    label: 'JSON',
    description: 'JavaScript Object Notation (developer friendly)',
    icon: FileJson,
  },
];

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  data,
  totalRows,
}) => {
  // Export options state
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [includeTotalRow, setIncludeTotalRow] = useState(true);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [customFilename, setCustomFilename] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Available columns
  const availableColumns = getAvailableColumns();

  // Handle column selection
  const handleColumnToggle = (columnKey: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnKey)
        ? prev.filter((key) => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  // Select all columns
  const handleSelectAll = () => {
    setSelectedColumns(availableColumns.map((col) => col.key));
  };

  // Clear all columns
  const handleClearAll = () => {
    setSelectedColumns([]);
  };

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);

    try {
      const options: ExportOptions = {
        format,
        includeHeaders,
        includeTotalRow,
        selectedColumns:
          selectedColumns.length > 0
            ? selectedColumns
            : availableColumns.map((col) => col.key),
        filename:
          customFilename || generateFilename('portfolio-balances', format),
      };

      // Validate options
      const errors = validateExportOptions(options);
      if (errors.length > 0) {
        toast.error(`Export validation failed: ${errors.join(', ')}`);
        return;
      }

      // Perform export
      exportBalanceData(data, options);

      // Close dialog after successful export
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(
        `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsExporting(false);
    }
  };

  // Reset form when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setFormat('csv');
      setIncludeHeaders(true);
      setIncludeTotalRow(true);
      setSelectedColumns([]);
      setCustomFilename('');
      setIsExporting(false);
    }
  }, [isOpen]);

  const selectedFormat = EXPORT_FORMATS.find((f) => f.value === format);
  const effectiveColumns =
    selectedColumns.length > 0
      ? selectedColumns
      : availableColumns.map((col) => col.key);
  const exportRowCount = includeTotalRow ? totalRows : totalRows - 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-xs">
              <Download className="h-5 w-5 text-white" />
              Export Portfolio Balances
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-lg overflow-y-auto max-h-[calc(90vh-8rem)]">
          {/* Export Format Selection */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Export Format
            </label>
            <Select
              value={format}
              onValueChange={(value: ExportFormat) => setFormat(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPORT_FORMATS.map((fmt) => {
                  const Icon = fmt.icon;
                  return (
                    <SelectItem key={fmt.value} value={fmt.value}>
                      <div className="flex items-center gap-xs">
                        <Icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{fmt.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {fmt.description}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Export Options */}
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">
              Export Options
            </label>
            <div className="space-y-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-foreground">Include Headers</div>
                  <div className="text-xs text-muted-foreground">
                    Add column headers to export
                  </div>
                </div>
                <Switch
                  checked={includeHeaders}
                  onCheckedChange={setIncludeHeaders}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-foreground">
                    Include Total Row
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Include portfolio summary row
                  </div>
                </div>
                <Switch
                  checked={includeTotalRow}
                  onCheckedChange={setIncludeTotalRow}
                />
              </div>
            </div>
          </div>

          {/* Column Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-foreground">
                Columns to Export ({effectiveColumns.length} selected)
              </label>
              <div className="flex gap-xs">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs"
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-xs"
                >
                  Clear All
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-xs max-h-48 overflow-y-auto border rounded-md p-sm">
              {availableColumns.map((column) => (
                <label
                  key={column.key}
                  className="flex items-center gap-xs text-sm cursor-pointer hover:bg-muted/50 p-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={
                      selectedColumns.includes(column.key) ||
                      selectedColumns.length === 0
                    }
                    onChange={() => handleColumnToggle(column.key)}
                    className="rounded"
                  />
                  <span className="text-foreground">{column.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Filename */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Filename (optional)
            </label>
            <Input
              placeholder={generateFilename('portfolio-balances', format)}
              value={customFilename}
              onChange={(e) => setCustomFilename(e.target.value)}
            />
            <div className="text-xs text-muted-foreground mt-1">
              Leave empty to use default filename with timestamp
            </div>
          </div>

          {/* Export Summary */}
          <div className="bg-muted/30 p-sm rounded-lg">
            <div className="text-sm font-medium text-foreground mb-2">
              Export Summary
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>
                Format: {selectedFormat?.label} ({selectedFormat?.description})
              </div>
              <div>
                Rows: {exportRowCount}{' '}
                {includeTotalRow ? '(including total)' : '(excluding total)'}
              </div>
              <div>Columns: {effectiveColumns.length}</div>
              <div>Headers: {includeHeaders ? 'Included' : 'Not included'}</div>
            </div>
          </div>
        </div>

        {/* Export Actions */}
        <div className="flex items-center justify-end gap-sm pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || effectiveColumns.length === 0}
            className="min-w-24"
          >
            {isExporting ? (
              <div className="flex items-center gap-xs">
                <div className="animate-spin w-4 h-4 border border-current border-t-transparent rounded-full"></div>
                Exporting...
              </div>
            ) : (
              <div className="flex items-center gap-xs">
                <Download className="h-4 w-4" />
                Export
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
