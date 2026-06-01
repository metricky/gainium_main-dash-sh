import type { ReactElement, ReactNode } from 'react';

import {
  BotFormProvider,
  type BotFormMode,
  type BotFormTabId,
} from '@/contexts/bots/form/BotFormProvider';
import { GridPageProvider } from '@/contexts/bots/grid/GridPageProvider';
import type { GridPageOptions } from '@/types/bots/grid/api';
import type { BotFormData } from '@/types/bots/form';
import { BotTypesEnum } from '@/types';

export interface GridFormProvidersProps {
  mode: BotFormMode;
  children: ReactNode;
  defaultTab?: BotFormTabId;
  initialFormData?: Partial<BotFormData>;
  gridOptions?: GridPageOptions;
}

/**
 * Wraps grid form screens with the same provider stack used by DCA bots so
 * autosave, lock handling, and discard prompts behave consistently.
 */
export const GridFormProviders = ({
  mode,
  children,
  defaultTab,
  initialFormData,
  gridOptions,
}: GridFormProvidersProps): ReactElement => {
  const formContent = (
    <BotFormProvider
      mode={mode}
      botType={BotTypesEnum.grid}
      {...(typeof defaultTab !== 'undefined' ? { defaultTab } : {})}
      {...(initialFormData ? { initialFormData } : {})}
    >
      {children}
    </BotFormProvider>
  );

  if (gridOptions) {
    return (
      <GridPageProvider options={gridOptions}>{formContent}</GridPageProvider>
    );
  }

  return <GridPageProvider>{formContent}</GridPageProvider>;
};
