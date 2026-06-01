import { cn } from '@/lib/utils';
import React, { useMemo } from 'react';

export interface ExchangeIconProps {
  icon: string;
  size?: string;
  className?: string;
}

/**
 * ExchangeIcon component that renders either an SVG/image or emoji/text
 * based on the icon format. If icon starts with `/images/`, it's treated as an image path.
 * The icon is displayed inside a rectangle with rounded corners and black background.
 */
const ExchangeIcon: React.FC<ExchangeIconProps> = ({
  icon,
  size = 'w-4 h-4',
  className = '',
}) => {
  const isImagePath = useMemo(
    () => icon.startsWith('/images/') || icon.startsWith('/'),
    [icon]
  );

  return (
    <div
      className={cn(
        'bg-black rounded-sm flex items-center justify-center p-1',
        size,
        className
      )}
    >
      {isImagePath ? (
        <img
          src={icon}
          alt="Exchange icon"
          className="w-full h-full object-contain"
        />
      ) : (
        <span className="text-white text-center leading-none">{icon}</span>
      )}
    </div>
  );
};

export default ExchangeIcon;
