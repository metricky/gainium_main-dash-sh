import { useEffect, useRef, useState } from 'react';
import { Link2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { VarToSearchType } from '@/types';
import type { GlobalVariable } from '@/types/globalVariables';
import { VariableSearch } from './GlobalVariableSearch';
import VariableChip from './VariableChip';
import useBotVarBinding, {
  type VarBindingPath,
} from '@/hooks/bots/global-variables/useBotVarBinding';
import { useVariableDetails } from '@/hooks/bots/global-variables/useVariableDetails';

interface VariableBindingControlProps {
  path: VarBindingPath;
  varType: VarToSearchType;
  disabled?: boolean;
  onVariableSelected?: (variable: GlobalVariable) => void;
  onVariableResolved?: (variable: GlobalVariable | null) => void;
  variant?: 'chip' | 'icon';
  className?: string;
  buttonLabel?: string;
  tooltip?: string;
  iconVariant?: 'default' | 'inline';
  iconSize?: 'sm' | 'md';
}

export const VariableBindingControl: React.FC<VariableBindingControlProps> = ({
  path,
  varType,
  disabled,
  onVariableSelected,
  onVariableResolved,
  variant = 'chip',
  className,
  buttonLabel,
  tooltip,
  iconVariant = 'default',
  iconSize = 'md',
}) => {
  const [open, setOpen] = useState(false);
  const { isBound, variableId, bindVariable, unbindVariable } =
    useBotVarBinding(path);
  const { variable } = useVariableDetails(variableId);

  const lastResolvedSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    if (!onVariableResolved) {
      return;
    }

    const signature = variable
      ? `${variable.id}::${variable.value ?? ''}::${variable.updatedAt ?? ''}`
      : 'null';

    if (lastResolvedSignatureRef.current === signature) {
      return;
    }

    lastResolvedSignatureRef.current = signature;
    onVariableResolved(variable ?? null);
  }, [variable, onVariableResolved]);

  const handleSelect = (nextVariable: GlobalVariable) => {
    bindVariable(nextVariable.id);
    onVariableSelected?.(nextVariable);
    setOpen(false);
  };

  const handleClear = () => {
    unbindVariable();
    setOpen(false);
  };

  const isLinked = Boolean(isBound && variable);
  const resolvedButtonLabel = buttonLabel ?? 'Link global variable';
  const resolvedTooltip = tooltip
    ? tooltip
    : isLinked && variable
      ? `Linked to ${variable.name}`
      : 'Link global variable';

  const triggerContent = (() => {
    if (variant === 'icon') {
      const sizeClasses = (() => {
        if (iconVariant === 'inline') {
          return iconSize === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
        }
        return iconSize === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
      })();

      const appearanceClasses =
        iconVariant === 'inline'
          ? 'rounded-md border border-border/70 bg-background text-muted-foreground shadow-sm transition-colors hover:border-primary/70 hover:text-primary hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background'
          : 'rounded-full border border-dashed border-muted-foreground/40 bg-background/80 text-muted-foreground transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/40';

      return (
        <Tooltip tooltip={resolvedTooltip} delay={200}>
          <PopoverTrigger asChild disabled={disabled}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={resolvedTooltip}
              className={cn(
                'relative flex items-center justify-center',
                sizeClasses,
                appearanceClasses,
                isLinked &&
                  'border-primary text-primary hover:border-primary hover:text-primary',
                disabled && 'pointer-events-none opacity-60',
                className
              )}
            >
              <Link2 className="h-3.5 w-3.5" />
              {isLinked && (
                <span className="absolute right-1 top-1 inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Button>
          </PopoverTrigger>
        </Tooltip>
      );
    }

    return (
      <PopoverTrigger asChild>
        {isLinked && variable ? (
          <div className={cn('w-full', className)}>
            <VariableChip
              variable={variable}
              disabled={Boolean(disabled)}
              onEdit={() => setOpen(true)}
              {...(!disabled ? { onRemove: handleClear } : {})}
            />
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn('w-full justify-start gap-xs text-xs', className)}
            disabled={disabled}
          >
            <Link2 className="h-3.5 w-3.5" />
            {resolvedButtonLabel}
          </Button>
        )}
      </PopoverTrigger>
    );
  })();

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        if (disabled) {
          return;
        }
        setOpen(nextOpen);
      }}
    >
      {triggerContent}
      <PopoverContent align="start" className="w-80 p-0">
        <VariableSearch
          varType={varType}
          selectedId={variableId}
          onSelect={handleSelect}
          {...(!disabled ? { onClear: handleClear } : {})}
        />
      </PopoverContent>
    </Popover>
  );
};

export default VariableBindingControl;
