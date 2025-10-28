
"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useUserPreferences } from './UserPreferencesContext';

interface I18nContextType {
  t: (key: string) => string;
  language: string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const userPreferencesContext = useUserPreferences();
  const language = userPreferencesContext?.preferences.language || 'es';
  const [translations, setTranslations] = useState({});

  const loadTranslations = useCallback(async () => {
    try {
      const module = await import(`@/locales/${language}.json`);
      setTranslations(module.default);
    } catch (error) {
      console.error(`Could not load translations for ${language}`, error);
      // Fallback to Spanish if the selected language file is not found
      const fallbackModule = await import(`@/locales/es.json`);
      setTranslations(fallbackModule.default);
    }
  }, [language]);

  useEffect(() => {
    loadTranslations();
  }, [language, loadTranslations]);

  const t = useCallback((key: string): string => {
    return (translations as Record<string, string>)[key] || key;
  }, [translations]);

  const value = { t, language };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};
