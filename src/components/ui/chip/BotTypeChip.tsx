import { cn } from '@/lib/utils';
import type { BotTypesEnum } from '@/types';
import { getBotTypeConfig } from '@/utils/botUtils';
import React from 'react';
import { Chip } from './chip';

interface BotTypeChipProps {
  botType: BotTypesEnum;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  chipStyle?: 'solid' | 'outline' | 'ghost' | 'soft';
  showIcon?: boolean;
  iconOnly?: boolean;
  className?: string;
}

export const BotTypeChip: React.FC<BotTypeChipProps> = ({
  botType,
  size = 'sm',
  chipStyle = 'soft',
  showIcon = true,
  iconOnly = false,
  className,
}) => {
  const config = getBotTypeConfig(botType);
  const IconComponent = config.icon;

  // Icon size mapping
  const iconSizeMap = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
  };

  // If iconOnly is true, render just the icon in a rounded box
  if (iconOnly) {
    const boxSizeMap = {
      xs: 'w-6 h-6',
      sm: 'w-7 h-7',
      md: 'w-8 h-8',
      lg: 'w-9 h-9',
      xl: 'w-10 h-10',
    };

    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-md',
          boxSizeMap[size],
          className
        )}
        style={{
          backgroundColor: config.color,
        }}
      >
        <IconComponent size={iconSizeMap[size]} className="text-white" />
      </div>
    );
  }

  return (
    <Chip
      variant="primary"
      size={size}
      chipStyle={chipStyle}
      className={cn('', className)}
      style={{
        backgroundColor:
          chipStyle === 'solid' ? config.color : `${config.color}15`,
        color: chipStyle === 'solid' ? 'white' : config.color,
        borderColor: chipStyle === 'outline' ? config.color : 'transparent',
      }}
    >
      {showIcon && (
        <IconComponent size={iconSizeMap[size]} className="shrink-0" />
      )}
      <span className="truncate">{config.label}</span>
    </Chip>
  );
};
