import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  /** `page` fills the parent at full size; `widget` is the compact in-card variant. */
  size?: 'page' | 'widget';
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  size = 'widget',
  className,
}) => {
  const isPage = size === 'page';
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        isPage ? 'gap-md py-16 px-md' : 'gap-sm py-8 px-md h-full',
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-muted text-muted-foreground',
            isPage ? 'w-16 h-16' : 'w-12 h-12'
          )}
        >
          {icon}
        </div>
      )}
      <h3
        className={cn(
          'font-semibold',
          isPage ? 'text-xl' : 'text-base'
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            'text-muted-foreground max-w-md',
            isPage ? 'text-sm' : 'text-xs'
          )}
        >
          {description}
        </p>
      )}
      {action && (
        <div className={isPage ? 'mt-4' : 'mt-2'}>
          <Button
            onClick={action.onClick}
            variant="default"
            size={isPage ? 'xl' : 'default'}
          >
            {action.icon && <span className="mr-2">{action.icon}</span>}
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
export { EmptyState };
