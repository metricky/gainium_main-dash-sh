import { Plus } from 'lucide-react';
import React from 'react';
import AddWidgetButton from './AddWidgetButton';

interface CategorizedWidget {
  type: string;
  title: string;
  description: string;
  category: string;
  defaultSize: { w: number; h: number };
  hasOptions: boolean;
}

interface AddWidgetGridItemProps {
  registry: 'dashboard' | 'trading' | 'bot';
  onAddWidget: (widgetType: CategorizedWidget) => void;
  className?: string;
}

const AddWidgetGridItem: React.FC<AddWidgetGridItemProps> = ({
  registry,
  onAddWidget,
  className = '',
}) => {
  return (
    <div className={`h-full w-full ${className}`}>
      <AddWidgetButton
        registry={registry}
        onAddWidget={onAddWidget}
        variant="dashed"
        className="h-full w-full min-h-[120px] text-muted-foreground hover:text-foreground flex flex-col items-center justify-center gap-xs"
      >
        <Plus className="h-8 w-8" />
        <span className="text-sm font-medium">Add Widget</span>
      </AddWidgetButton>
    </div>
  );
};

export default AddWidgetGridItem;
