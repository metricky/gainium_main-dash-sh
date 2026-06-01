import type { ReactNode } from 'react';

export interface WidgetTab {
  id: string;
  title: string;
  content: ReactNode;
}

export interface WidgetMetadata {
  id: string;
  type: string;
  title: string;
  displayName?: string;
  defaultSize: {
    w: number;
    h: number;
  };
  minSize?: {
    w: number;
    h: number;
  };
  maxSize?: {
    w: number;
    h: number;
  };
  tabs?: WidgetTab[];
  hasOptions?: boolean;
  hasDropdown?: boolean;
  dropdownOptions?: { value: string; label: string }[];
  selectedDropdownValue?: string;
  filters?: string;
  value?: {
    primary: string;
    secondary?: string;
    change?: {
      value: string;
      percentage: string;
      isPositive: boolean;
    };
  };
}
