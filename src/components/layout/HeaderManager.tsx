import React from 'react';
import WidgetsManager from './WidgetsManager';

/**
 * HeaderWidgetsManager
 *
 * A specialized widget manager that only shows the navigation/header widgets section.
 * This is used in the navbar to allow users to manage header widgets separately
 * from dashboard widgets.
 *
 * This component is opened via events (from Navbar) and should not display a visible trigger.
 */
const HeaderWidgetsManager: React.FC = () => {
  return (
    <div className="hidden">
      <WidgetsManager registry="navigation" showNavigationSection={true} />
    </div>
  );
};

export default HeaderWidgetsManager;
