import { Clock } from 'lucide-react';
import React from 'react';
import { Chip } from './chip';

interface TimeChipProps {
  time: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  chipStyle?: 'solid' | 'outline' | 'ghost' | 'soft';
  showIcon?: boolean;
  className?: string;
}

export const TimeChip: React.FC<TimeChipProps> = ({
  time,
  size = 'sm',
  chipStyle = 'soft',
  showIcon = true,
  className,
}) => {
  return (
    <Chip
      variant="secondary"
      size={size}
      chipStyle={chipStyle}
      className={className}
    >
      {showIcon && <Clock className="w-3 h-3" />}
      {time}
    </Chip>
  );
};
