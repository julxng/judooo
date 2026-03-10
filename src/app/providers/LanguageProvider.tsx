'use client';

import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import type { Locale } from '@/lib/i18n/translations';

const STORAGE_KEY = 'judooo.language';
const DEFAULT_LANGUAGE: Locale = 'en';
const supportedLanguages: Locale[] = ['en', 'vi'];

type LanguageContextValue = {
  language: Locale;
  setLanguage: (language: Locale) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const isSupportedLanguage = (value: string): value is Locale =>
  supportedLanguages.includes(value as Locale);

export const LanguageProvider = ({ children }: PropsWithChildren) => {
  const [language, setLanguage] = useState<Locale>(DEFAULT_LANGUAGE);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem(STORAGE_KEY);

    setLanguage(
      storedLanguage && isSupportedLanguage(storedLanguage) ? storedLanguage : DEFAULT_LANGUAGE,
    );
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [isHydrated, language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }

  return context;
};
