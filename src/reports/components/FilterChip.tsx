// FilterChip - Individual filter chip component
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import React from 'react';

interface FilterChipProps {
  label: string;
  value: string;
  onEdit: () => void;
  onRemove: () => void;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  value,
  onEdit,
  onRemove,
}) => {
  return (
    <Badge
      variant="secondary"
      className="group h-7 px-2 gap-1 cursor-pointer hover:bg-secondary/80 transition-colors"
      onClick={onEdit}
    >
      <span className="text-xs font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">:</span>
      <span className="text-xs">{value}</span>
      <Button
        variant="ghost"
        size="sm"
        className="h-4 w-4 p-0 ml-1 opacity-60 hover:opacity-100 hover:bg-transparent"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <X className="h-3 w-3" />
      </Button>
    </Badge>
  );
};
