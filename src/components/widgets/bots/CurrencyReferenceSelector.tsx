import React from 'react';
import { Button } from '../../ui/button';
import { OrderSizeTypeEnum } from '@/types';

interface CurrencyReferenceSelectorProps {
  currencyReference: OrderSizeTypeEnum;
  onCurrencyReferenceChange: (currencyReference: OrderSizeTypeEnum) => void;
}

const CurrencyReferenceSelector: React.FC<CurrencyReferenceSelectorProps> = ({
  currencyReference,
  onCurrencyReferenceChange,
}) => {
  return (
    <div className="space-y-xs">
      <div className="flex gap-1">
        <Button
          variant={
            currencyReference === OrderSizeTypeEnum.quote
              ? 'default'
              : 'outline'
          }
          size="sm"
          className={`text-xs flex-1 h-8 ${
            currencyReference === 'quote'
              ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
              : 'border-primary'
          }`}
          onClick={() => onCurrencyReferenceChange(OrderSizeTypeEnum.quote)}
        >
          Quote
        </Button>
        <Button
          variant={
            currencyReference === OrderSizeTypeEnum.base ? 'default' : 'outline'
          }
          size="sm"
          className={`text-xs flex-1 h-8 ${
            currencyReference === 'base'
              ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
              : 'border-primary'
          }`}
          onClick={() => onCurrencyReferenceChange(OrderSizeTypeEnum.base)}
        >
          Base
        </Button>
        <Button
          variant={
            currencyReference === OrderSizeTypeEnum.usd ? 'default' : 'outline'
          }
          size="sm"
          className={`text-xs flex-1 h-8 ${
            currencyReference === 'usd'
              ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
              : 'border-primary'
          }`}
          onClick={() => onCurrencyReferenceChange(OrderSizeTypeEnum.usd)}
        >
          USD
        </Button>
      </div>
    </div>
  );
};

export default CurrencyReferenceSelector;
