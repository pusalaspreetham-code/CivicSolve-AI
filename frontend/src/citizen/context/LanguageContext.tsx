import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  LanguageConfig, 
  TranslationKey, 
  SUPPORTED_LANGUAGES, 
  DEFAULT_LANGUAGE, 
  getLanguageByCode, 
  getTranslation 
} from '../translations';

interface LanguageContextType {
  currentLanguage: LanguageConfig;
  setLanguage: (code: string) => void;
  t: (key: TranslationKey, fallback?: string) => string;
  languages: LanguageConfig[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'civicsolve_lang_preference';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<LanguageConfig>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved) {
        return getLanguageByCode(saved);
      }
    } catch {
      // LocalStorage may be restricted in sandboxes
    }
    return DEFAULT_LANGUAGE;
  });

  const setLanguage = (code: string) => {
    const nextLang = getLanguageByCode(code);
    setCurrentLanguageState(nextLang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLang.code);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    document.documentElement.lang = currentLanguage.code;
    document.documentElement.dir = currentLanguage.direction || 'ltr';
  }, [currentLanguage]);

  const t = (key: TranslationKey, fallback?: string): string => {
    return getTranslation(currentLanguage.code, key, fallback);
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        t,
        languages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
