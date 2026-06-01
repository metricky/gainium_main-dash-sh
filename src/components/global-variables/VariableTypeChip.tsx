/**
 * VariableTypeChip Component
 *
 * A specialized chip component for displaying global variable types
 * with consistent styling and optional tooltips.
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import { GlobalVariablesTypeEnum } from '@/types';
import { VARIABLE_TYPE_COLORS } from '@/types/globalVariables';

interface VariableTypeChipProps {
  type: GlobalVariablesTypeEnum;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const VariableTypeChip: React.FC<VariableTypeChipProps> = ({
  type,
  showTooltip = false,
  size = 'md',
  className = '',
}) => {
  const colors = VARIABLE_TYPE_COLORS[type];

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const getTypeDescription = (type: GlobalVariablesTypeEnum): string => {
    switch (type) {
      case GlobalVariablesTypeEnum.text:
        return 'Text values - supports strings and multiline content';
      case GlobalVariablesTypeEnum.int:
        return 'Integer values - whole numbers only (e.g., 123, -456)';
      case GlobalVariablesTypeEnum.float:
        return 'Float values - decimal numbers (e.g., 123.45, -67.89)';
      default:
        return 'Variable type';
    }
  };

  const chip = (
    <Badge
      variant="outline"
      className={`
        ${colors.background} 
        ${colors.text} 
        ${colors.border} 
        ${sizeClasses[size]}
        font-medium
        ${className}
      `}
    >
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Badge>
  );

  if (showTooltip) {
    return (
      <Tooltip
        tooltip={getTypeDescription(type)}
        side="top"
        className="z-[10000]"
      >
        {chip}
      </Tooltip>
    );
  }

  return chip;
};

export default VariableTypeChip;
