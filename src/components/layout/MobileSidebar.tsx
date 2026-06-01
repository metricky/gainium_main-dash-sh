import { X } from 'lucide-react';
import React from 'react';
import { useUIStore } from '../../stores/uiStore';
import { LogoIcon } from '../common/LogoIcon';
import { LogoWordmark } from '../common/LogoWordmark';
import { Button } from '../ui/button';
import NavigationSidebar from './NavigationSidebar';

interface MobileSidebarProps {
  activePage: string;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({ activePage }) => {
  const { isMobileSidebarOpen, setMobileSidebarOpen } = useUIStore();

  const handleClose = () => {
    setMobileSidebarOpen(false);
  };

  if (!isMobileSidebarOpen) return null;

  return (
    <>
      {/* Overlay backdrop */}
      <div
        className="md:hidden fixed inset-0 bg-black/50 z-40"
        onClick={handleClose}
      />

      {/* Sidebar */}
      <div className="md:hidden fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-card border-l border-border z-50 flex flex-col h-full">
        {/* Header */}
        <div className="px-4 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-sm">
            <div className="w-8 h-8 flex items-center justify-center">
              <LogoIcon className="w-8 h-8" />
            </div>
            <LogoWordmark className="h-6" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="w-8 h-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-hidden">
          {/* Always use legacy NavigationSidebar (v1) on mobile */}
          <NavigationSidebar
            activePage={activePage}
            variant="mobile"
            showHeader={false}
            onNavigate={handleClose}
            className="h-full"
          />
        </div>
      </div>
    </>
  );
};

export default MobileSidebar;
