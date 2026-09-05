import { TranslationDictionary, TranslationKey } from './types';
import { en } from './en';
import { te } from './te';
import { hi } from './hi';
import { ta } from './ta';
import { bn } from './bn';
import { kn } from './kn';
import { mr } from './mr';
import { gu } from './gu';
import { ml } from './ml';
import { pa } from './pa';
import { or } from './or';
import { as } from './as';
import { ur } from './ur';

export * from './types';
export * from './languages';

export const translations: Record<string, TranslationDictionary> = {
  en,
  te,
  hi,
  ta,
  bn,
  kn,
  mr,
  gu,
  ml,
  pa,
  or,
  as,
  ur,
};

/**
 * Safe translation getter with fallback to English canonical dictionary.
 */
export function getTranslation(langCode: string, key: TranslationKey, fallback?: string): string {
  const dictionary = translations[langCode.toLowerCase()];
  if (dictionary && dictionary[key]) {
    return dictionary[key];
  }
  // Safe English fallback
  if (en[key]) {
    return en[key];
  }
  return fallback || key;
}
