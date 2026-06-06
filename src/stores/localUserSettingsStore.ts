import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Local user settings store for persisting user preferences locally
 * These settings are not synced to the backend and are stored in localStorage
 */

interface LocalUserSettings {
  // Invoice settings
  invoiceAddress: string;
  // UUID of the exchange marked as default — auto-selected when creating a
  // new bot (any type). Empty string means "no default set".
  defaultExchangeUuid: string;
}

interface LocalUserSettingsStore {
  settings: LocalUserSettings;
  setInvoiceAddress: (address: string) => void;
  /** Set (or, when passed '', clear) the default exchange. */
  setDefaultExchangeUuid: (uuid: string) => void;
  resetSettings: () => void;
}

const defaultSettings: LocalUserSettings = {
  invoiceAddress: '',
  defaultExchangeUuid: '',
};

export const useLocalUserSettingsStore = create<LocalUserSettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,

      setInvoiceAddress: (address: string) =>
        set((state) => ({
          settings: {
            ...state.settings,
            invoiceAddress: address,
          },
        })),

      setDefaultExchangeUuid: (uuid: string) =>
        set((state) => ({
          settings: {
            ...state.settings,
            // Toggle off if the same exchange is starred again.
            defaultExchangeUuid:
              state.settings.defaultExchangeUuid === uuid ? '' : uuid,
          },
        })),

      resetSettings: () =>
        set({
          settings: defaultSettings,
        }),
    }),
    {
      name: 'local-user-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
