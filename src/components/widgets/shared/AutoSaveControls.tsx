import { logger } from '@/lib/loggerInstance';
import { useTradingViewStore } from '@/stores/tradingViewStore';
import React from 'react';

interface AutoSaveControlsProps {
  onManualSave: () => void;
  onManualLoad: () => Promise<boolean>;
}

export const AutoSaveControls: React.FC<AutoSaveControlsProps> = ({
  onManualSave,
  onManualLoad,
}) => {
  const { autoSaveEnabled, setAutoSaveEnabled } = useTradingViewStore();

  const handleManualLoad = async () => {
    const success = await onManualLoad();
    if (success) {
      logger.info('Manual load successful');
    } else {
      logger.warn('Manual load failed - no saved layout found');
    }
  };

  return (
    <div className="p-md border rounded-lg bg-card">
      <h3 className="text-lg font-semibold mb-3">Auto-Save Controls</h3>

      <div className="space-y-sm">
        <div className="flex items-center space-x-xs">
          <input
            type="checkbox"
            id="autoSaveEnabled"
            checked={autoSaveEnabled}
            onChange={(e) => setAutoSaveEnabled(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="autoSaveEnabled" className="text-sm">
            Enable Auto-Save
          </label>
        </div>

        <div className="flex space-x-xs">
          <button
            onClick={onManualSave}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            Manual Save
          </button>
          <button
            onClick={handleManualLoad}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
          >
            Manual Load
          </button>
        </div>
      </div>
    </div>
  );
};
