/* eslint-disable react-refresh/only-export-components */
import type { ChartPickerCoordinates } from '@/components/widgets/shared/TradingViewChart';
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

export interface TradingTerminalUtilsContextType {
  coordinates: ChartPickerCoordinates | null;
  setCoordinates: (coords: ChartPickerCoordinates | null) => void;
  activePickerField: string | false;
  setActivePickerField: (
    field: string | false | ((prev: string | false) => string | false)
  ) => void;
  handleChartPick: (coords: ChartPickerCoordinates) => void;
  onActiveChanged: (isActive: boolean) => void;
}

export const TradingTerminalUtilsContext = createContext<
  TradingTerminalUtilsContextType | undefined
>(undefined);

export const TradingTerminalUtilsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [coordinates, setCoordinates] = useState<ChartPickerCoordinates | null>(
    null
  );
  const [activePickerField, setActivePickerField] = useState<string | false>(
    false
  );

  const handleChartPick = useCallback(
    (coords: ChartPickerCoordinates) => {
      if (!activePickerField) {
        return;
      }
      // Store the coordinates with the picker field that requested them
      setCoordinates({ ...coords, pickerField: activePickerField });
      // Immediately deactivate the picker after receiving coordinates
      setActivePickerField(false);
    },
    [activePickerField]
  );

  const onActiveChanged = useCallback((isActive: boolean) => {
    if (!isActive) {
      setActivePickerField(false);
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      coordinates,
      setCoordinates,
      activePickerField,
      setActivePickerField,
      handleChartPick,
      onActiveChanged,
    }),
    [coordinates, activePickerField, handleChartPick, onActiveChanged]
  );

  return (
    <TradingTerminalUtilsContext.Provider value={contextValue}>
      {children}
    </TradingTerminalUtilsContext.Provider>
  );
};

export const useTradingTerminalUtils = () => {
  const context = useContext(TradingTerminalUtilsContext);

  if (!context) {
    throw new Error(
      'useTradingTerminalUtils must be used within TradingTerminalUtilsProvider'
    );
  }

  return context;
};
