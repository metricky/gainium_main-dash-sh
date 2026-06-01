import { ScrollArea } from '@/components/ui/scroll-area';
import { useUIStore } from '@/stores/uiStore';
import { Building2, ChevronRight, Wallet } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import RightPanel from './RightPanel';

interface PortfolioPanelProps {
  onClose: () => void;
  onNavigate?: () => void;
}

const PortfolioPanel: React.FC<PortfolioPanelProps> = ({
  onClose,
  onNavigate,
}) => {
  const navigate = useNavigate();
  const navigationSecondaryPinned = useUIStore(
    (s) => s.navigationSecondaryPinned
  );
  const toggleNavigationSecondaryPinned = useUIStore(
    (s) => s.toggleNavigationSecondaryPinned
  );

  const items = [
    {
      id: 'portfolio',
      label: 'Portfolio',
      href: '/portfolio',
      icon: <Wallet className="h-4 w-4" />,
    },
    {
      id: 'exchanges',
      label: 'Exchanges',
      href: '/exchanges',
      icon: <Building2 className="h-4 w-4" />,
    },
  ];

  const handleClick = (href: string) => {
    navigate(href);
    onNavigate?.();
    if (!navigationSecondaryPinned) {
      onClose();
    }
  };

  return (
    <RightPanel
      title="Portfolio"
      onClose={onClose}
      pinned={navigationSecondaryPinned}
      onPinToggle={toggleNavigationSecondaryPinned}
    >
      <ScrollArea className="flex-1 px-6 py-4">
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => handleClick(item.href)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group text-left text-card-foreground/80 hover:text-card-foreground hover:bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg w-8 h-8 flex items-center justify-center text-card-foreground/80 group-hover:text-card-foreground">
                  {item.icon}
                </div>
                <span className="text-sm font-medium truncate">
                  {item.label}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </ScrollArea>
    </RightPanel>
  );
};

export default PortfolioPanel;
