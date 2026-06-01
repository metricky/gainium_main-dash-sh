import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Menu,
  Settings2,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useBottomNavStore, type NavItem } from '../../stores/bottomNavStore';
import { useChatStore } from '../../stores/chatStore';
import { useUIStore } from '../../stores/uiStore';
import { Switch } from '../ui/switch';
import { BottomNavCustomizationPanel } from './BottomNavCustomizationPanel';

interface MobileBottomNavProps {
  activePage: string;
}

interface FloatingSubmenuProps {
  originRef: React.RefObject<HTMLElement | null>;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const FloatingSubmenu: React.FC<FloatingSubmenuProps> = ({
  originRef,
  isOpen,
  onClose,
  children,
}) => {
  const barRef = useRef<HTMLDivElement>(null);
  const [pointerLeft, setPointerLeft] = useState<number | null>(null);
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (isOpen) {
      setShouldRender(true);
    } else {
      timer = setTimeout(() => setShouldRender(false), 200);
    }

    return () => {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!shouldRender) return;

    const computePosition = () => {
      const originEl = originRef.current as HTMLElement | null;
      const barEl = barRef.current as HTMLElement | null;
      if (!originEl || !barEl) return;

      const originRect = originEl.getBoundingClientRect();
      const barRect = barEl.getBoundingClientRect();

      const originCenter = originRect.left + originRect.width / 2;
      const leftInsideBar = originCenter - barRect.left;

      const clamped = Math.max(12, Math.min(barRect.width - 12, leftInsideBar));
      setPointerLeft(clamped);
    };

    computePosition();
    const raf = requestAnimationFrame(computePosition);
    window.addEventListener('resize', computePosition);
    window.addEventListener('scroll', computePosition, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', computePosition);
      window.removeEventListener('scroll', computePosition);
    };
  }, [shouldRender, originRef]);

  if (!shouldRender) return null;

  // Portal out of the bottom-nav container so backdrop-filter samples
  // the actual page content. The nav has `isolation: isolate`, which
  // would otherwise trap the popup inside an empty stacking context.
  return createPortal(
    <>
      <div
        className={cn(
          'md:hidden fixed inset-0 z-40 transition-opacity duration-300',
          isOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />
      <div
        ref={barRef}
        role="menu"
        aria-hidden={!isOpen}
        className={cn(
          'md:hidden fixed bottom-[76px] left-3 right-3 z-50 glass-surface-card rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] py-3 px-xs transition-all duration-300',
          isOpen
            ? 'opacity-100 pointer-events-auto translate-y-0'
            : 'opacity-0 pointer-events-none translate-y-2'
        )}
      >
        {pointerLeft !== null && (
          <div
            className="absolute -bottom-1.5 w-3 h-3 bg-background/70 dark:bg-card/70 transform rotate-45 transition-opacity duration-300"
            style={{ left: pointerLeft - 6 }}
          />
        )}
        <div className="flex gap-sm items-center justify-start overflow-auto py-1 scrollbar-hide">
          {children}
        </div>
      </div>
    </>,
    document.body
  );
};

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activePage }) => {
  const navigate = useNavigate();
  const toggleChat = useChatStore((s) => s.toggleChat);
  const isChatOpen = useChatStore(
    (s) => s.open || s.detached || s.detachedMinimized
  );
  const toggleMobileSidebar = useUIStore((s) => s.toggleMobileSidebar);
  const {
    activeNavItems,
    isCustomizationPanelOpen,
    setCustomizationPanelOpen,
    autoHide,
    toggleAutoHide,
    availableItems,
  } = useBottomNavStore();
  const [pressedItemId, setPressedItemId] = useState<string | null>(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const moreLongPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const botItems = availableItems.filter((i) => i.category === 'bots');

  // Trading submenu state (selected bot + open)
  const [selectedTradingBotId, setSelectedTradingBotId] = useState<
    string | null
  >(() => {
    try {
      return localStorage.getItem('selectedTradingBotId') || null;
    } catch {
      return null;
    }
  });
  const [isTradingMenuOpen, setIsTradingMenuOpen] = useState(false);
  const tradingButtonRef = useRef<HTMLButtonElement | null>(null);

  // Auto-hide on scroll aligned with main layout scroll container
  useEffect(() => {
    const container = document.querySelector<HTMLElement>(
      '[data-main-content]'
    );
    const scrollTarget: HTMLElement | Window =
      container && container.scrollHeight > container.clientHeight
        ? container
        : window;

    if (!autoHide) {
      setIsVisible(true);
      lastScrollY.current =
        scrollTarget instanceof Window
          ? scrollTarget.scrollY
          : scrollTarget.scrollTop;
      return;
    }

    const getScrollTop = () =>
      scrollTarget instanceof Window
        ? scrollTarget.scrollY
        : scrollTarget.scrollTop;

    const handleScroll = () => {
      const currentScrollY = getScrollTop();
      const delta = currentScrollY - lastScrollY.current;

      if (delta < 0 || currentScrollY < 10) {
        setIsVisible(true);
      } else if (delta > 0 && currentScrollY > 10) {
        setIsVisible(false);
      }

      lastScrollY.current = currentScrollY;
    };

    scrollTarget.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollTarget.removeEventListener('scroll', handleScroll);
  }, [autoHide, activePage]);

  // Handle press animations
  const handlePress = useCallback((itemId: string) => {
    setPressedItemId(itemId);
    setTimeout(() => setPressedItemId(null), 150);
  }, []);

  // Create event handlers for items (no long press)
  const createItemEventHandlers = useCallback(
    (item: NavItem) => {
      const clickHandler = () => {
        handlePress(item.id);
        if (item.id === 'chat') {
          // Toggle so re-tapping the chat icon also closes it, and so
          // it honors the user's docked/detached preference.
          toggleChat();
        } else if (item.onClick) {
          item.onClick();
        } else if (item.href) {
          navigate(item.href);
        }
        // Close the trading menu if any other nav item is clicked
        setIsTradingMenuOpen(false);
      };

      return {
        onClick: clickHandler,
      };
    },
    [handlePress, toggleChat, setIsTradingMenuOpen, navigate]
  );

  // Get navigation items (excluding More button)
  const navItems = activeNavItems.filter((item) => item.id !== 'more');
  // Limit to max 4 rendered slots
  const navItemsToRender = navItems.slice(0, 4);
  const moreItem = activeNavItems.find((item) => item.id === 'more');

  // Render a single navigation item
  const renderNavItem = useCallback(
    (item: NavItem) => {
      const isActive =
        item.id === 'chat'
          ? isChatOpen
          : item.href
            ? activePage === item.href ||
              (activePage.startsWith(item.href) && item.href !== '/')
            : false;
      const isPressed = pressedItemId === item.id;
      const Icon = item.icon;
      const eventHandlers = createItemEventHandlers(item);

      // Regular navigation items
      return (
        <button
          key={item.id}
          {...eventHandlers}
          className={cn(
            'relative flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all duration-200',
            'active:scale-95',
            isPressed && 'scale-95',
            'group'
          )}
        >
          {/* Active indicator pill */}
          {isActive && (
            <div className="absolute inset-1 bg-foreground/6 dark:bg-foreground/10 rounded-xl transition-all duration-300" />
          )}
          <div
            className={cn(
              'relative w-6 h-6 mb-0.5 flex items-center justify-center transition-all duration-200',
              'group-active:scale-95'
            )}
          >
            <Icon
              className={cn(
                'w-5 h-5 transition-colors duration-200',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground group-hover:text-foreground'
              )}
            />
          </div>
          <span
            className={cn(
              'relative text-[10px] font-semibold truncate transition-colors duration-200',
              isActive
                ? 'text-foreground'
                : 'text-muted-foreground group-hover:text-foreground'
            )}
          >
            {item.label}
          </span>
        </button>
      );
    },
    [activePage, isChatOpen, pressedItemId, createItemEventHandlers]
  );

  // Utility: find bot nav item by id
  const findBotById = useCallback(
    (id?: string | null) => botItems.find((b) => b.id === id) || null,
    [botItems]
  );

  // Keep selection in localStorage and track route changes
  useEffect(() => {
    const matched = botItems.find(
      (b) => b.href && activePage.startsWith(b.href)
    );
    if (matched) {
      if (matched.id !== selectedTradingBotId) {
        setSelectedTradingBotId(matched.id);
        try {
          localStorage.setItem('selectedTradingBotId', matched.id);
        } catch (_err) {
          //
        }
      }
    }
  }, [activePage, botItems, selectedTradingBotId]);

  const handleTradingMainClick = useCallback(
    (coreItem: NavItem) => {
      handlePress(coreItem.id);
      const selectedBot = findBotById(selectedTradingBotId);
      if (selectedBot) {
        if (activePage.startsWith(selectedBot.href || '')) {
          setIsTradingMenuOpen((v) => !v);
        } else if (selectedBot.href) {
          navigate(selectedBot.href);
        }
      } else {
        if (coreItem.href) {
          navigate(coreItem.href);
        }
      }
    },
    [handlePress, selectedTradingBotId, findBotById, activePage, navigate]
  );

  const handleTradingChevronClick = useCallback(() => {
    setIsTradingMenuOpen((v) => !v);
  }, []);

  const handleSelectTradingBot = useCallback(
    (botId: string) => {
      const found = findBotById(botId);
      if (!found) return;
      setSelectedTradingBotId(botId);
      try {
        localStorage.setItem('selectedTradingBotId', botId);
      } catch (_err) {
        //
      }
      setIsTradingMenuOpen(false);
      if (found.href) {
        navigate(found.href);
      }
    },
    [findBotById, navigate]
  );

  // More button click handler
  const handleMoreClick = useCallback(() => {
    handlePress('more');
    setIsTradingMenuOpen(false);
    toggleMobileSidebar();
  }, [handlePress, toggleMobileSidebar]);

  // Long-press handlers for More button (to open options)
  const handleMoreTouchStart = useCallback(() => {
    moreLongPressTimer.current = setTimeout(() => {
      setShowOptionsMenu(true);
      moreLongPressTimer.current = null;
    }, 500);
  }, []);

  const handleMoreTouchEnd = useCallback(() => {
    if (moreLongPressTimer.current) {
      clearTimeout(moreLongPressTimer.current);
      moreLongPressTimer.current = null;
    }
  }, []);

  return (
    <>
      {/* Options Menu Popup */}
      {showOptionsMenu && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40"
            onClick={() => setShowOptionsMenu(false)}
          />
          <div className="md:hidden fixed bottom-[76px] right-3 z-50 glass-surface rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] py-1.5 min-w-44 animate-in slide-in-from-bottom-2 duration-200">
            <button
              onClick={() => {
                setShowOptionsMenu(false);
                setCustomizationPanelOpen(true);
              }}
              className="flex items-center gap-sm w-full px-4 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors"
            >
              <Settings2 className="w-4 h-4 text-muted-foreground" />
              <span>Customize</span>
            </button>
            <div className="flex items-center justify-between w-full px-4 py-2.5">
              <div className="flex items-center gap-sm">
                <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Autohide</span>
              </div>
              <Switch
                checked={autoHide}
                onCheckedChange={() => {
                  toggleAutoHide();
                }}
                className="scale-75"
              />
            </div>
          </div>
        </>
      )}

      <div
        className={cn(
          'md:hidden fixed left-3 right-3 bottom-2 z-50',
          'glass-surface-card',
          'rounded-lg',
          'shadow-[0_2px_20px_rgba(0,0,0,0.06),0_0_0_0.5px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.3),0_0_0_0.5px_rgba(255,255,255,0.05)]',
          'mobile-bottom-nav',
          'transition-all duration-300',
          !isVisible && 'translate-y-[calc(100%+1rem)] opacity-0'
        )}
        data-tour="mobile-bottom-nav"
      >
        <div className="flex items-center py-1 px-1">
          <div className="flex items-center justify-around flex-1">
            {navItemsToRender.map((item) => {
              if (item.id === 'trading') {
                const selectedBot = findBotById(selectedTradingBotId);
                const Icon = (selectedBot && selectedBot.icon) || item.icon;
                const isActive = selectedBot
                  ? activePage.startsWith(selectedBot.href || '')
                  : activePage.startsWith(item.href || '');

                return (
                  <div key={item.id} className="relative flex-1">
                    <button
                      ref={tradingButtonRef}
                      onClick={() => handleTradingMainClick(item)}
                      className={cn(
                        'relative flex flex-col items-center justify-center w-full py-1.5 px-1 rounded-xl transition-all duration-200',
                        'active:scale-95',
                        pressedItemId === item.id && 'scale-95',
                        'group'
                      )}
                    >
                      {/* Active indicator pill */}
                      {isActive && (
                        <div className="absolute inset-1 bg-foreground/6 dark:bg-foreground/10 rounded-xl transition-all duration-300" />
                      )}
                      <div
                        className={cn(
                          'relative w-6 h-6 mb-0.5 flex items-center justify-center transition-all duration-200',
                          'group-active:scale-95'
                        )}
                      >
                        <Icon
                          className={cn(
                            'w-5 h-5 transition-colors duration-200',
                            isActive
                              ? 'text-foreground'
                              : 'text-muted-foreground group-hover:text-foreground'
                          )}
                        />
                      </div>
                      <span
                        className={cn(
                          'relative text-[10px] font-semibold truncate transition-colors duration-200',
                          isActive
                            ? 'text-foreground'
                            : 'text-muted-foreground group-hover:text-foreground'
                        )}
                      >
                        {selectedBot?.label || item.label}
                      </span>
                    </button>

                    {/* Chevron button */}
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        handleTradingChevronClick();
                      }}
                      className={cn(
                        'absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full',
                        'text-muted-foreground/60 hover:text-foreground hover:bg-muted/40 active:bg-muted/50 transition-colors',
                        isTradingMenuOpen && 'text-foreground'
                      )}
                      aria-label="Open trading bot types"
                      aria-expanded={isTradingMenuOpen}
                    >
                      <ChevronDown
                        className={cn(
                          'w-2.5 h-2.5 transition-transform',
                          isTradingMenuOpen && 'rotate-180'
                        )}
                      />
                    </button>

                    {/* Trading bot submenu popup */}
                    <FloatingSubmenu
                      originRef={tradingButtonRef}
                      isOpen={isTradingMenuOpen}
                      onClose={() => setIsTradingMenuOpen(false)}
                    >
                      {botItems.map((b) => {
                        const BotIcon = b.icon;
                        const selected = b.id === selectedTradingBotId;
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => handleSelectTradingBot(b.id)}
                            title={b.label}
                            aria-pressed={selected}
                            className={cn(
                              'flex flex-col items-center gap-1 px-3 py-2 rounded-lg hover:bg-muted/40 min-w-16 text-center',
                              selected ? 'ring-2 ring-primary' : ''
                            )}
                          >
                            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-muted/10">
                              <BotIcon className="w-5 h-5" />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {b.label}
                            </span>
                          </button>
                        );
                      })}
                    </FloatingSubmenu>
                  </div>
                );
              }

              return renderNavItem(item);
            })}

            {/* More button (with a chevron-up affordance for the
                bottom-nav settings popover — mirrors the Trading
                chevron-down). Long-press still works as a shortcut. */}
            {moreItem && (
              <div className="relative flex-1">
                <button
                  onClick={handleMoreClick}
                  onTouchStart={handleMoreTouchStart}
                  onTouchEnd={handleMoreTouchEnd}
                  onTouchCancel={handleMoreTouchEnd}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setShowOptionsMenu(true);
                  }}
                  className={cn(
                    'relative flex flex-col items-center justify-center w-full py-1.5 px-1 rounded-xl transition-all duration-200',
                    'active:scale-95',
                    pressedItemId === moreItem.id && 'scale-95',
                    'group'
                  )}
                >
                  <div
                    className={cn(
                      'relative w-6 h-6 mb-0.5 flex items-center justify-center transition-all duration-200',
                      'group-active:scale-95'
                    )}
                  >
                    <Menu className="w-5 h-5 transition-colors duration-200 text-muted-foreground group-hover:text-foreground" />
                  </div>
                  <span className="relative text-xs font-semibold truncate transition-colors duration-200 text-muted-foreground group-hover:text-foreground">
                    More
                  </span>
                </button>

                {/* Chevron-up — opens the bottom-nav options popover
                    (Customize, Autohide). `data-tour` exposes it as a
                    spotlight target for the Max walkthrough's mobile
                    nav step. */}
                <button
                  data-tour="mobile-bottom-nav.moreChevron"
                  onClick={(event) => {
                    event.stopPropagation();
                    setShowOptionsMenu((v) => !v);
                  }}
                  className={cn(
                    'absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full',
                    'text-muted-foreground/60 hover:text-foreground hover:bg-muted/40 active:bg-muted/50 transition-colors',
                    showOptionsMenu && 'text-foreground'
                  )}
                  aria-label="Open bottom nav options"
                  aria-expanded={showOptionsMenu}
                >
                  <ChevronUp
                    className={cn(
                      'w-2.5 h-2.5 transition-transform',
                      showOptionsMenu && 'rotate-180'
                    )}
                  />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customization Panel */}
      <BottomNavCustomizationPanel
        isOpen={isCustomizationPanelOpen}
        onClose={() => setCustomizationPanelOpen(false)}
      />
    </>
  );
};

export default MobileBottomNav;
