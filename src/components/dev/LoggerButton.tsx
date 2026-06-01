import { useLoggerStore } from '@/stores/useLoggerStore';
import { Bug } from 'lucide-react';
import React from 'react';
import { Button } from '../ui/button';

const LoggerButton: React.FC = () => {
  const { isOpen, toggleDrawer } = useLoggerStore();

  const handleClick = () => {
    console.log('[LoggerButton] Clicked! Current state:', isOpen);
    toggleDrawer();
    console.log('[LoggerButton] After toggle, new state should be:', !isOpen);
  };

  React.useEffect(() => {
    console.log('[LoggerButton] Mounted, isOpen:', isOpen);
  }, [isOpen]);

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`p-1 h-8 w-8 ${isOpen ? 'bg-accent' : ''}`}
      onClick={handleClick}
      title="Dev Logger"
    >
      <Bug className="h-4 w-4" />
    </Button>
  );
};

export default LoggerButton;
