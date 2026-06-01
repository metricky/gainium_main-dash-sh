import { cn } from '@/lib/utils';
import React from 'react';
import { logger } from '../../lib/loggerInstance';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';

interface InfoCardProps {
  title: string;
  description?: string;
  value?: string | number;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  description,
  value,
  icon,
  className,
  children,
}) => {
  React.useEffect(() => {
    logger.debug('InfoCard rendered', { title, value });
  }, [title, value]);

  return (
    <Card
      className={cn('transition-all duration-200 hover:shadow-md', className)}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-xs">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {value && (
          <div className="text-2xl font-bold text-foreground mb-2">{value}</div>
        )}
        {children}
      </CardContent>
    </Card>
  );
};
