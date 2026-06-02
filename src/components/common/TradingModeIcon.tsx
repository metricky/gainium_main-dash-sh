import { useUIStore } from '@/stores/uiStore';
import { useTradingModeSwitching } from '@/stores/live/tradingContext';
import { Activity, DollarSign, FlaskConical, Loader2 } from 'lucide-react';

interface TradingModeIconProps {
  /** Size variant for the icon container */
  size?: 'sm' | 'md' | 'lg';
  /** Whether clicking the icon toggles trading mode */
  clickable?: boolean;
  /** Show tooltip on hover */
  showTooltip?: boolean;
  /** Custom onClick handler (overrides default toggle behavior) */
  onClick?: () => void;
  /** Custom class name */
  className?: string;
  /** Force a specific trading mode (overrides the global isLiveTrading state) */
  forceLive?: boolean;
}

// `md` is tuned to match the navbar page title (text-xl bold ≈ 20px).
// `sm` matches body text (text-sm/base). `lg` is for hero placements.
const SIZE_CLASSES = {
  sm: {
    container: 'w-4 h-4',
    icon: 'w-2.5 h-2.5',
  },
  md: {
    container: 'w-5 h-5',
    icon: 'w-3 h-3',
  },
  lg: {
    container: 'w-8 h-8',
    icon: 'w-5 h-5',
  },
};

/**
 * Trading mode badge.
 *   Live = green ($, success)
 *   Paper = muted gray (flask, safe)
 *   Demo = blue (activity, info/read-only)
 */
export const TradingModeIcon: React.FC<TradingModeIconProps> = ({
  size = 'md',
  clickable = false,
  showTooltip = true,
  onClick,
  className = '',
  forceLive,
}) => {
  const isLiveTrading = useUIStore((s) => s.isLiveTrading);
  const tradingMode = useUIStore((s) => s.tradingMode);
  const setTradingMode = useUIStore((s) => s.setTradingMode);
  const { isSwitching } = useTradingModeSwitching();

  const isDemoMode = tradingMode === 'demo';
  const effectiveIsLive = forceLive !== undefined ? forceLive : isLiveTrading;
  // Only reflect the global switch when this badge mirrors global state.
  // `forceLive` badges are static labels and must not show a spinner.
  const showSwitching = forceLive === undefined && isSwitching;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (clickable) {
      setTradingMode(!isLiveTrading);
    }
  };

  const sizeClasses = SIZE_CLASSES[size];

  let modeBg: string;
  let modeLabel: string;
  let ModeIcon: typeof DollarSign;
  let iconAnimation = '';
  if (isDemoMode) {
    modeBg = 'bg-info';
    modeLabel = 'Demo';
    ModeIcon = Activity;
    iconAnimation = 'animate-pulse';
  } else if (effectiveIsLive) {
    modeBg = 'bg-success';
    modeLabel = 'Live';
    ModeIcon = DollarSign;
  } else {
    modeBg = 'bg-neutral';
    modeLabel = 'Paper';
    ModeIcon = FlaskConical;
  }

  const tooltipText = showTooltip
    ? showSwitching
      ? `Switching to ${modeLabel}…`
      : `${modeLabel} Trading`
    : undefined;

  return (
    <span
      className={`flex items-center justify-center rounded-md shrink-0 ${modeBg} ${
        sizeClasses.container
      } ${clickable || onClick ? 'cursor-pointer select-none' : ''} ${className}`}
      title={tooltipText}
      onClick={clickable || onClick ? handleClick : undefined}
    >
      {showSwitching ? (
        <Loader2 className={`${sizeClasses.icon} text-white animate-spin`} />
      ) : (
        <ModeIcon className={`${sizeClasses.icon} text-white ${iconAnimation}`} />
      )}
    </span>
  );
};
