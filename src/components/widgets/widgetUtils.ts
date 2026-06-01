import type { WidgetMetadata } from './WidgetWrapper';

interface DropdownOption {
  value: string;
  label: string;
}

// Utility function to generate dynamic widget name for widget manager
export const getWidgetDisplayName = (metadata: WidgetMetadata): string => {
  if (
    metadata.hasDropdown &&
    metadata.selectedDropdownValue &&
    metadata.filters
  ) {
    const selectedOption = metadata.dropdownOptions?.find(
      (option: DropdownOption) =>
        option.value === metadata.selectedDropdownValue
    );
    return `${selectedOption?.label || metadata.selectedDropdownValue} | ${metadata.filters}`;
  }
  return metadata.title;
};
