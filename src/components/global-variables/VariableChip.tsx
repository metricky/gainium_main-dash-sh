import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { GlobalVariable } from '@/types/globalVariables';
import { Pencil, X } from 'lucide-react';

interface VariableChipProps {
  variable: GlobalVariable;
  onEdit?: () => void;
  onRemove?: () => void;
  disabled?: boolean;
}

const typeToColor: Record<GlobalVariable['type'], string> = {
  text: 'bg-blue-500/15 text-blue-400',
  int: 'bg-emerald-500/15 text-emerald-400',
  float: 'bg-purple-500/15 text-purple-400',
};

export const VariableChip: React.FC<VariableChipProps> = ({
  variable,
  onEdit,
  onRemove,
  disabled,
}) => {
  const hasActions = Boolean(onEdit || onRemove);
  return (
    <div
      className={cn(
        'group flex w-full flex-wrap items-center gap-sm rounded-lg border border-border bg-background/80 px-2 py-1.5 shadow-inner transition-colors',
        disabled ? 'opacity-70' : 'hover:border-primary/50'
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="min-w-0 truncate text-sm font-semibold text-card-foreground">
          {variable.name}
        </span>
        <div className="flex min-w-0 items-center gap-1.5">
          <span
            className={cn(
              'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase leading-none tracking-wide',
              typeToColor[variable.type]
            )}
          >
            {variable.type}
          </span>
          <span className="min-w-0 truncate text-xs text-muted-foreground">
            {variable.value}
          </span>
        </div>
      </div>
      {hasActions && (
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {onEdit && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-primary"
              onClick={onEdit}
              disabled={disabled}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={onRemove}
              disabled={disabled}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default VariableChip;
