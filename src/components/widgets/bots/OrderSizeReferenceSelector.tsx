import React from 'react';
import { TerminalButtonStack } from '../../ui/terminal-button-stack';

interface OrderSizeReferenceSelectorProps {
  orderSizeReference?: 'notional' | 'cost' | undefined;
  onOrderSizeReferenceChange: (orderSizeReference: 'notional' | 'cost') => void;
}

export const OrderSizeReferenceSelector: React.FC<
  OrderSizeReferenceSelectorProps
> = ({ orderSizeReference, onOrderSizeReferenceChange }) => {
  return (
    <TerminalButtonStack
      value={orderSizeReference || 'notional'}
      onValueChange={(value) =>
        onOrderSizeReferenceChange(value as 'notional' | 'cost')
      }
      options={[
        { value: 'notional', label: 'Notional Value' },
        { value: 'cost', label: 'Cost' },
      ]}
      className="w-full"
    />
  );
};

export default OrderSizeReferenceSelector;
