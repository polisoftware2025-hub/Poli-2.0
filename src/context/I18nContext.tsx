
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
  // Ensure a default language ('es') if context or preferences are not yet available.
  const language = userPreferencesContext?.preferences.language || 'es';
  const [translations, setTranslations] = useState({});

  const loadTranslations = useCallback(async (lang: string) => {
    try {
      const module = await import(`@/locales/${lang}.json`);
      setTranslations(module.default);
    } catch (error) {
      console.error(`Could not load translations for ${lang}`, error);
      // Fallback to Spanish if the selected language file is not found
      try {
        const fallbackModule = await import(`@/locales/es.json`);
        setTranslations(fallbackModule.default);
      } catch (fallbackError) {
        console.error(`Could not load fallback translations for Spanish`, fallbackError);
      }
    }
  }, []);

  useEffect(() => {
    // Only attempt to load translations if the language is one of the valid, expected values.
    if (language && ['es', 'en'].includes(language)) {
      loadTranslations(language);
    }
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
