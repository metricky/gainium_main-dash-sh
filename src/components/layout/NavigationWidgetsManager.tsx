import React from 'react';
import WidgetsManager from './WidgetsManager';

const NavigationWidgetsManager: React.FC = () => {
  return <WidgetsManager registry="dashboard" showNavigationSection={true} />;
};

export default NavigationWidgetsManager;
