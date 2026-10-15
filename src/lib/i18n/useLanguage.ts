'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { TRANSLATIONS, type Locale, type Translations } from './translations';

const LANGUAGE_KEY = 'vibe_language';

interface LanguageContextType {
  locale: Locale;
  setLocale: (newLocale: Locale) => void;
  t: (key: keyof Translations, fallback?: string) => string;
  isRTL: boolean;
}

export const LanguageContext = createContext<LanguageContextType>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => TRANSLATIONS.en[key] || key,
  isRTL: false,
});

export function useLanguage() {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_KEY) as Locale | null;
      if (saved === 'ar' || saved === 'en') {
        setLocaleState(saved);
        applyDocumentDirection(saved);
      } else {
        // Detect browser language
        const navLang = navigator.language?.toLowerCase() || '';
        if (navLang.startsWith('ar')) {
          setLocaleState('ar');
          applyDocumentDirection('ar');
        }
      }
    } catch {}
  }, []);

  const applyDocumentDirection = (loc: Locale) => {
    if (typeof document !== 'undefined') {
      const isArabic = loc === 'ar';
      document.documentElement.setAttribute('dir', isArabic ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('lang', loc);
      if (isArabic) {
        document.body.classList.add('font-arabic');
      } else {
        document.body.classList.remove('font-arabic');
      }
    }
  };

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    applyDocumentDirection(newLocale);
    try {
      localStorage.setItem(LANGUAGE_KEY, newLocale);
      // Dispatch a storage event so sibling components or windows sync instantly
      window.dispatchEvent(new Event('language-change'));
    } catch {}
  }, []);

  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem(LANGUAGE_KEY) as Locale | null;
        if (saved && (saved === 'ar' || saved === 'en') && saved !== locale) {
          setLocaleState(saved);
          applyDocumentDirection(saved);
        }
      } catch {}
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('language-change', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('language-change', handleSync);
    };
  }, [locale]);

  const t = useCallback(
    (key: keyof Translations, fallback?: string): string => {
      const dict = TRANSLATIONS[locale] || TRANSLATIONS.en;
      return dict[key] || fallback || TRANSLATIONS.en[key] || key;
    },
    [locale]
  );

  return {
    locale,
    setLocale,
    t,
    isRTL: locale === 'ar',
  };
}

export function getActiveLanguage(): Locale {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    if (saved === 'ar' || saved === 'en') return saved;
  } catch {}
  return 'en';
}
