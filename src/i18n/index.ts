import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import zhCN from './locales/zh-CN';

export const LANGUAGES = [
  { code: 'zh-CN', label: '简体中文' },
  { code: 'en', label: 'English' },
] as const;

export type Language = (typeof LANGUAGES)[number]['code'];

const STORAGE_KEY = 'ip-please.lang';

function readStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'zh-CN') return stored;
  } catch {
    /* private mode / non-browser */
  }
  // The original game is Chinese-first: never switch language implicitly.
  return 'zh-CN';
}

void i18n.use(initReactI18next).init({
  resources: {
    'zh-CN': { translation: zhCN },
    en: { translation: en },
  },
  lng: readStoredLanguage(),
  fallbackLng: 'zh-CN',
  supportedLngs: ['zh-CN', 'en'],
  load: 'currentOnly',
  // Resources are bundled, so initialization can be synchronous. The canvas
  // game reads strings during its very first frame.
  initAsync: false,
  interpolation: { escapeValue: false },
  returnNull: false,
  returnObjects: true,
});

i18n.on('languageChanged', (lng) => {
  const language: Language = lng === 'en' ? 'en' : 'zh-CN';
  if (typeof document !== 'undefined') document.documentElement.lang = language;
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    /* ignore */
  }
});

export function getLanguage(): Language {
  return i18n.language === 'en' ? 'en' : 'zh-CN';
}

export function changeLanguage(language: Language): Promise<unknown> {
  return i18n.changeLanguage(language);
}

export { i18n };
