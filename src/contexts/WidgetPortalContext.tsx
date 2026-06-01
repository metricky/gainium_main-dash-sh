import React, { createContext } from 'react';

/**
 * Context that provides portal configuration for widgets
 */
interface WidgetPortalContextValue {
  portalTarget: Element;
  zIndexClass: string;
  isInFullscreen: boolean;
  isInNativeFullscreen: boolean;
}

const WidgetPortalContext = createContext<WidgetPortalContextValue | null>(
  null
);

export const WidgetPortalProvider: React.FC<{
  children: React.ReactNode;
  value: WidgetPortalContextValue;
}> = ({ children, value }) => {
  return (
    <WidgetPortalContext.Provider value={value}>
      {children}
    </WidgetPortalContext.Provider>
  );
};

export { WidgetPortalContext };
