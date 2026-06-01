import { ScrollArea } from '@/components/ui/scroll-area';
import { IS_CLOUD } from '@/config/mode';
import { linkTo } from '@/lib/demoMode';
import { useUIStore } from '@/stores/uiStore';
import {
  BookOpen,
  Calendar,
  Handshake,
  HelpCircle,
  MessageSquare,
  Monitor,
  Send,
  Users,
  Youtube,
} from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import RightPanel from './RightPanel';

interface HelpPanelProps {
  onClose: () => void;
  onNavigate?: () => void;
}

const HelpPanel: React.FC<HelpPanelProps> = ({ onClose, onNavigate }) => {
  const navigate = useNavigate();

  // External marketing links stay regardless of build target.
  // The in-app destinations (`/help`, `/community`) are feature-gated
  // so the nav doesn't surface dead links. The standalone `/onboarding`
  // route was removed when the inline Max copilot walkthrough replaced
  // the modal-based flow.
  const resourceItems = [
    IS_CLOUD && {
      id: 'helpcenter',
      label: 'Help Center',
      href: '/help',
      icon: <HelpCircle className="w-6 h-6" />,
    },
    {
      id: 'university',
      label: 'University',
      href: 'https://gainium.io/university',
      icon: <BookOpen className="w-6 h-6" />,
    },
    {
      id: 'videos',
      label: 'Videos',
      href: 'https://www.youtube.com/@gainium',
      icon: <Youtube className="w-6 h-6" />,
    },
    {
      id: 'webinar',
      label: 'Webinar',
      href: 'https://gainium.io/webinars',
      icon: <Calendar className="w-6 h-6" />,
    },
    IS_CLOUD && {
      id: 'demo',
      label: 'Demo',
      href: 'https://gainium.io/demo',
      icon: <Monitor className="w-6 h-6" />,
    },
    IS_CLOUD && {
      id: 'community',
      label: 'Community',
      href: '/community/latest-topics',
      icon: <Users className="w-6 h-6" />,
    },
    {
      id: 'request-feature',
      label: 'Request a feature',
      href: 'https://community.gainium.io/c/feature-requests/6',
      icon: <MessageSquare className="w-6 h-6" />,
    },
  ].filter(Boolean) as Array<{
    id: string;
    label: string;
    href: string;
    icon: React.ReactNode;
  }>;

  const supportItems = [
    {
      id: 'connect-support',
      label: 'Connect with support',
      href: 'https://gainium.io/support',
      icon: <MessageSquare className="w-6 h-6" />,
    },
    {
      id: 'set-up-assistance',
      label: 'Set Up Assistance',
      href: 'https://gainium.io/assist',
      icon: <Handshake className="w-6 h-6" />,
    },
    {
      id: 'telegram',
      label: 'Telegram',
      href: 'https://t.me/gainiumio',
      icon: <Send className="w-6 h-6" />,
    },
  ];

  const contactItems = [
    {
      id: 'onboarding-help',
      label: 'Onboarding Help',
      href: 'mailto:onboarding@gainium.io',
      icon: <Handshake className="w-6 h-6" />,
    },
  ];

  const handleClick = (href?: string) => {
    if (!href) return;
    if (href.startsWith('http') || href.startsWith('mailto:')) {
      window.open(href, '_blank', 'noopener noreferrer');
      onNavigate?.();
      if (!navigationSecondaryPinned) {
        onClose();
      }
    } else {
      // use navigate for internal routes
      navigate(linkTo(href));
      onNavigate?.();
      if (!navigationSecondaryPinned) {
        onClose();
      }
    }
  };

  const { navigationSecondaryPinned, toggleNavigationSecondaryPinned } =
    useUIStore();

  return (
    <RightPanel
      title="Resource Center"
      onClose={onClose}
      pinned={navigationSecondaryPinned}
      onPinToggle={toggleNavigationSecondaryPinned}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            title="Request a feature"
            aria-label="Request a feature"
            onClick={() =>
              handleClick('https://community.gainium.io/c/feature-requests/6')
            }
            className="h-8 w-8 p-0 bg-primary text-primary-foreground rounded flex items-center justify-center hover:bg-primary/90"
          >
            <span className="sr-only">Request feature</span>
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      }
    >
      <ScrollArea className="flex-1 px-6 py-4">
        <div className="space-y-6">
          <div>
            <div className="grid grid-cols-3 gap-3">
              {resourceItems.map((item) => (
                <button
                  key={item.id}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg text-card-foreground/80 hover:bg-muted/30 transition-all"
                  onClick={() => handleClick(item.href)}
                >
                  <div className="rounded-full p-3 bg-muted/30 text-card-foreground/80">
                    {item.icon}
                  </div>
                  <div className="text-xs text-center text-muted-foreground">
                    {item.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">Support</h3>
            <div className="grid grid-cols-3 gap-3">
              {supportItems.map((item) => (
                <button
                  key={item.id}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg text-card-foreground/80 hover:bg-muted/30 transition-all"
                  onClick={() => handleClick(item.href)}
                >
                  <div className="rounded-full p-3 bg-muted/30 text-card-foreground/80">
                    {item.icon}
                  </div>
                  <div className="text-xs text-center text-muted-foreground">
                    {item.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3">Contact</h3>
            <div className="grid grid-cols-3 gap-3">
              {contactItems.map((item) => (
                <button
                  key={item.id}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg text-card-foreground/80 hover:bg-muted/30 transition-all"
                  onClick={() => handleClick(item.href)}
                >
                  <div className="rounded-full p-3 bg-muted/30 text-card-foreground/80">
                    {item.icon}
                  </div>
                  <div className="text-xs text-center text-muted-foreground">
                    {item.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </RightPanel>
  );
};

export default HelpPanel;
