'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
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

const getInitialLanguage = (): Locale => {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored && isSupportedLanguage(stored) ? stored : DEFAULT_LANGUAGE;
};

export const LanguageProvider = ({ children }: PropsWithChildren) => {
  const [language, setLanguageState] = useState<Locale>(getInitialLanguage);

  const setLanguage = useCallback((next: Locale) => {
    setLanguageState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, []);

  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage]);

  return (
    <LanguageContext.Provider value={value}>
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
