import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Local user settings store for persisting user preferences locally
 * These settings are not synced to the backend and are stored in localStorage
 */

interface LocalUserSettings {
  // Invoice settings
  invoiceAddress: string;
}

interface LocalUserSettingsStore {
  settings: LocalUserSettings;
  setInvoiceAddress: (address: string) => void;
  resetSettings: () => void;
}

const defaultSettings: LocalUserSettings = {
  invoiceAddress: '',
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
