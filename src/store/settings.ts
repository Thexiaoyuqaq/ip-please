import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { changeLanguage, getLanguage, type Language } from '@/i18n';

interface SettingsState {
  muted: boolean;
  language: Language;
  setMuted(muted: boolean): void;
  toggleMuted(): void;
  setLanguage(language: Language): void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      muted: false,
      language: getLanguage(),
      setMuted: (muted) => set({ muted }),
      toggleMuted: () => set({ muted: !get().muted }),
      setLanguage: (language) => {
        void changeLanguage(language);
        set({ language });
      },
    }),
    {
      name: 'ip-please-settings',
      partialize: (state) => ({ muted: state.muted, language: state.language }),
    },
  ),
);
