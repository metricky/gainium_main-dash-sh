import { createContext, useContext, type PropsWithChildren } from 'react';

import { useGridPage } from '@/hooks/bots/grid/useGridPage';
import type { GridPageApi, GridPageOptions } from '@/types/bots/grid/api';

interface GridPageProviderProps extends PropsWithChildren {
  options?: GridPageOptions;
  value?: GridPageApi;
}

const GridPageContext = createContext<GridPageApi | undefined>(undefined);

export const GridPageProvider: React.FC<GridPageProviderProps> = ({
  children,
  options,
  value,
}) => {
  const api = useGridPage(options ?? {});
  const contextValue = value ?? api;

  return (
    <GridPageContext.Provider value={contextValue}>
      {children}
    </GridPageContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useGridPageContext = (): GridPageApi => {
  const context = useContext(GridPageContext);

  if (!context) {
    throw new Error(
      'useGridPageContext must be used within a GridPageProvider'
    );
  }

  return context;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useOptionalGridPageContext = (): GridPageApi | undefined =>
  useContext(GridPageContext);
