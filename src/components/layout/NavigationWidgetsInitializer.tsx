import React from 'react';
import { useNavigationWidgetsStore } from '../../stores/navigationWidgetsStore';

/**
 * Previously this component auto-inserted a default watchlist navigation widget when
 * the user had none. Product change: allow users to have zero navigation widgets.
 *
 * We keep this component in place to allow future lightweight migrations if needed.
 * For now it simply does nothing.
 */
const NavigationWidgetsInitializer: React.FC = () => {
  // Intentionally no-op – leaving hook call here would re-trigger persistence subscribes if added.
  // const { widgets } = useNavigationWidgetsStore();
  useNavigationWidgetsStore();
  return null;
};

export default NavigationWidgetsInitializer;
