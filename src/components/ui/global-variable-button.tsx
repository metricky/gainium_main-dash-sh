import type { GlobalVariable } from '@/types/globalVariables';
import type { VarToSearchType } from '@/types';
import { VariableBindingControl } from '@/components/global-variables/VariableBindingControl';
import type { VarBindingPath } from '@/hooks/bots/global-variables/useBotVarBinding';

interface GlobalVariableButtonProps {
  path: VarBindingPath;
  varType: VarToSearchType;
  disabled?: boolean;
  className?: string;
  tooltip?: string;
  onVariableSelected?: (variable: GlobalVariable) => void;
  onVariableResolved?: (variable: GlobalVariable | null) => void;
  appearance?: 'default' | 'inline';
  size?: 'sm' | 'md';
}

export const GlobalVariableButton: React.FC<GlobalVariableButtonProps> = ({
  path,
  varType,
  disabled,
  className,
  tooltip,
  onVariableSelected,
  onVariableResolved,
  appearance,
  size,
}) => {
  const optionalProps = {
    ...(disabled !== undefined ? { disabled } : {}),
    ...(className ? { className } : {}),
    ...(tooltip ? { tooltip } : {}),
    ...(onVariableSelected ? { onVariableSelected } : {}),
    ...(onVariableResolved ? { onVariableResolved } : {}),
    ...(appearance ? { iconVariant: appearance } : {}),
    ...(size ? { iconSize: size } : {}),
  };

  return (
    <VariableBindingControl
      path={path}
      varType={varType}
      variant="icon"
      {...optionalProps}
    />
  );
};

export default GlobalVariableButton;
