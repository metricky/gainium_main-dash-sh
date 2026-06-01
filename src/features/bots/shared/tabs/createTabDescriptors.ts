import type {
  BotFormTabDescriptor,
  BotFormTabNavigationConfig,
} from '@/features/bots/widgets/BotForm/types';

export interface TabNavigationOverrides {
  currentLabel?: string;
  previous?: { id: string; label?: string };
}

export interface TabDescriptorInput extends Omit<
  BotFormTabDescriptor,
  'navigation'
> {
  navigation?: TabNavigationOverrides;
}

export type CreateTabDescriptorsOptions = {
  defaultPreviousLabel?: (tabId: string, previous: { label: string }) => string;
};

// previous/next navigation removed — only `currentLabel` remains

export const createTabDescriptors = (
  inputs: TabDescriptorInput[],
  _options: CreateTabDescriptorsOptions = {}
): BotFormTabDescriptor[] => {
  // options are intentionally unused now

  if (!Array.isArray(inputs) || inputs.length === 0) {
    return [];
  }

  return inputs.map((input, _index) => {
    const navigationOverrides = input.navigation ?? {};

    const navigation: BotFormTabNavigationConfig = {
      currentLabel: navigationOverrides.currentLabel ?? input.label,
    };

    // previous/next navigation no longer created

    return {
      ...input,
      navigation,
    } satisfies BotFormTabDescriptor;
  });
};
