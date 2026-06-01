import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { IndicatorSelector } from '@/components/indicators/IndicatorSelector';
import { IndicatorConfigurationModal } from '@/components/indicators/IndicatorConfigurationModal';
import type { IndicatorParamsState } from '@/types/indicators/indicatorParams';
import { getIndicatorDefinition } from '@/types/indicators/indicatorLogic';
import type { IndicatorDefinition } from '@/types/indicators/indicatorTypes';
import type { IndicatorConfig } from '@/types/indicators/indicators';
import type {
  ExchangeEnum,
  IndicatorAction,
  IndicatorEnum,
  IndicatorSection,
} from '@/types';

type SelectorClosedState = { open: false };

type SelectorOpenState = {
  open: true;
  allowedActions?: IndicatorAction[];
  favorites?: IndicatorEnum[];
  onToggleFavorite?: (type: IndicatorEnum, next: boolean) => void;
  favoritesMutating?: boolean;
  isFavoriteMutating?: (type: IndicatorEnum) => boolean;
  onSelect: (type: IndicatorEnum) => void;
  title?: string;
  description?: string;
  allowedTypes?: IndicatorEnum[];
};

type SelectorState = SelectorClosedState | SelectorOpenState;

type ConfigClosedState = { open: false; definition: null };

type ConfigOpenState = {
  open: true;
  definition: IndicatorDefinition;
  initialParams?: IndicatorParamsState;
  title?: string;
  submitLabel?: string;
  onSubmit: (params: IndicatorParamsState) => void;
};

type ConfigState = ConfigClosedState | ConfigOpenState;

type AddSubmitPayload = {
  type: IndicatorEnum;
  definition: IndicatorDefinition;
  params: IndicatorParamsState;
};

type EditSubmitPayload = {
  definition: IndicatorDefinition;
  params: IndicatorParamsState;
};

export interface OpenAddIndicatorOptions {
  allowedActions?: IndicatorAction[];
  favorites?: IndicatorEnum[];
  onToggleFavorite?: (type: IndicatorEnum, next: boolean) => void;
  favoritesMutating?: boolean;
  isFavoriteMutating?: (type: IndicatorEnum) => boolean;
  selectorTitle?: string;
  selectorDescription?: string;
  configurationTitle?: string;
  submitLabel?: string;
  initialParams?: IndicatorParamsState;
  type?: IndicatorEnum;
  allowedTypes?: IndicatorEnum[];
  onSubmit: (payload: AddSubmitPayload) => void;
}

export interface OpenEditIndicatorOptions {
  indicator: IndicatorConfig;
  title?: string;
  submitLabel?: string;
  onSubmit: (payload: EditSubmitPayload) => void;
}

export interface IndicatorDialogController {
  openAddIndicator: (options: OpenAddIndicatorOptions) => void;
  openEditIndicator: (options: OpenEditIndicatorOptions) => void;
  closeModals: () => void;
  dialogs: React.ReactNode;
  isOpen: boolean;
}

export const useIndicatorDialogs = ({
  action,
  section,
  exchange,
}: {
  action: IndicatorAction;
  section: IndicatorSection;
  // Optional bot exchange; threaded to the config modal so interval selects
  // filter to the exchange's supported intervals (legacy parity).
  exchange?: ExchangeEnum | undefined;
}): IndicatorDialogController => {
  const [selectorState, setSelectorState] = React.useState<SelectorState>({
    open: false,
  });
  const [configState, setConfigState] = React.useState<ConfigState>({
    open: false,
    definition: null,
  });

  const openConfigurationModal = React.useCallback(
    (
      definition: IndicatorDefinition,
      options: {
        initialParams?: IndicatorParamsState;
        title?: string;
        submitLabel?: string;
        onSubmit: (params: IndicatorParamsState) => void;
      }
    ) => {
      const nextState: ConfigOpenState = {
        open: true,
        definition,
        onSubmit: options.onSubmit,
      };

      if (options.title !== undefined) {
        nextState.title = options.title;
      }

      if (options.submitLabel !== undefined) {
        nextState.submitLabel = options.submitLabel;
      }

      if (options.initialParams !== undefined) {
        nextState.initialParams = options.initialParams;
      }

      setConfigState(nextState);
    },
    []
  );

  const openAddIndicator = React.useCallback(
    (options: OpenAddIndicatorOptions) => {
      const openConfigurator = (type: IndicatorEnum) => {
        const definition = getIndicatorDefinition(type);
        const configOptions: {
          initialParams?: IndicatorParamsState;
          title?: string;
          submitLabel?: string;
          onSubmit: (params: IndicatorParamsState) => void;
        } = {
          onSubmit: (params) => {
            options.onSubmit({ type, definition, params });
          },
        };

        configOptions.submitLabel = options.submitLabel ?? 'Add indicator';

        if (options.configurationTitle !== undefined) {
          configOptions.title = options.configurationTitle;
        }

        if (options.initialParams !== undefined) {
          configOptions.initialParams = options.initialParams;
        }

        openConfigurationModal(definition, configOptions);
      };

      if (options.type) {
        if (
          !options.allowedTypes ||
          options.allowedTypes.includes(options.type)
        ) {
          openConfigurator(options.type);
          return;
        }
        const fallbackType = options.allowedTypes?.[0];
        if (fallbackType) {
          openConfigurator(fallbackType);
          return;
        }
      }

      const nextState: SelectorOpenState = {
        open: true,
        onSelect: (type) => {
          setSelectorState({ open: false });
          openConfigurator(type);
        },
      };

      if (options.allowedActions) {
        nextState.allowedActions = options.allowedActions;
      }

      if (options.allowedTypes) {
        nextState.allowedTypes = options.allowedTypes;
      }

      if (options.favorites) {
        nextState.favorites = options.favorites;
      }

      if (options.onToggleFavorite) {
        nextState.onToggleFavorite = options.onToggleFavorite;
      }

      if (options.favoritesMutating !== undefined) {
        nextState.favoritesMutating = options.favoritesMutating;
      }

      if (options.isFavoriteMutating) {
        nextState.isFavoriteMutating = options.isFavoriteMutating;
      }

      if (options.selectorTitle !== undefined) {
        nextState.title = options.selectorTitle;
      }

      if (options.selectorDescription !== undefined) {
        nextState.description = options.selectorDescription;
      }

      setSelectorState(nextState);
    },
    [openConfigurationModal]
  );

  const openEditIndicator = React.useCallback(
    (options: OpenEditIndicatorOptions) => {
      const definition = getIndicatorDefinition(options.indicator.type);
      openConfigurationModal(definition, {
        initialParams: options.indicator as IndicatorParamsState,
        title: options.title ?? `${definition.label} settings`,
        submitLabel: options.submitLabel ?? 'Save changes',
        onSubmit: (params) => {
          options.onSubmit({ definition, params });
        },
      });
    },
    [openConfigurationModal]
  );

  const closeModals = React.useCallback(() => {
    setSelectorState({ open: false });
    setConfigState({ open: false, definition: null });
  }, []);

  const handleSelectorChange = React.useCallback((open: boolean) => {
    if (!open) {
      setSelectorState({ open: false });
    }
  }, []);

  const handleConfigChange = React.useCallback((open: boolean) => {
    if (!open) {
      setConfigState({ open: false, definition: null });
    }
  }, []);

  const dialogs = (
    <>
      {selectorState.open ? (
        <Dialog open={selectorState.open} onOpenChange={handleSelectorChange}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl overflow-hidden rounded-xl border bg-card p-0 shadow-xl">
            <DialogHeader className="space-y-xs border-b border-border/60 bg-muted/40 px-6 pt-6 pb-4">
              <DialogTitle className="text-lg font-semibold leading-6">
                {selectorState.title ?? 'Select an indicator'}
              </DialogTitle>
              {selectorState.description ? (
                <DialogDescription className="text-sm text-muted-foreground">
                  {selectorState.description}
                </DialogDescription>
              ) : null}
            </DialogHeader>
            <IndicatorSelector
              onSelect={(type) => selectorState.onSelect(type)}
              className="px-6 pb-6"
              {...(selectorState.favorites
                ? { favorites: selectorState.favorites }
                : {})}
              {...(selectorState.onToggleFavorite
                ? { onToggleFavorite: selectorState.onToggleFavorite }
                : {})}
              {...(selectorState.favoritesMutating !== undefined
                ? { favoritesMutating: selectorState.favoritesMutating }
                : {})}
              {...(selectorState.isFavoriteMutating
                ? { isFavoriteMutating: selectorState.isFavoriteMutating }
                : {})}
              {...(selectorState.allowedActions
                ? { allowedActions: selectorState.allowedActions }
                : {})}
              {...(selectorState.allowedTypes
                ? { allowedTypes: selectorState.allowedTypes }
                : {})}
            />
          </DialogContent>
        </Dialog>
      ) : null}

      {configState.open ? (
        <IndicatorConfigurationModal
          open={configState.open}
          onOpenChange={handleConfigChange}
          definition={configState.definition}
          onSubmit={(params) => {
            configState.onSubmit(params);
          }}
          action={action}
          section={section}
          exchange={exchange}
          {...(configState.initialParams !== undefined
            ? { initialParams: configState.initialParams }
            : {})}
          {...(configState.title !== undefined
            ? { title: configState.title }
            : {})}
          {...(configState.submitLabel !== undefined
            ? { submitLabel: configState.submitLabel }
            : {})}
        />
      ) : null}
    </>
  );

  return {
    openAddIndicator,
    openEditIndicator,
    closeModals,
    dialogs,
    isOpen: selectorState.open || configState.open,
  };
};
