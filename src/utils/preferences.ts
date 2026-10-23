import { normalizeLanguage, syncDocumentLanguage } from './i18n';
import type { Language } from '../types';
type PreferenceStorage = Pick<Storage, 'getItem' | 'setItem'>;
export function readLanguagePreference(storage?: PreferenceStorage): Language {
  try { return normalizeLanguage((storage || window.localStorage).getItem('unitask_language')); }
  catch { return normalizeLanguage(null); }
}
export function saveLanguagePreference(value: unknown, storage?: PreferenceStorage): Language {
  const language = syncDocumentLanguage(value);
  try { (storage || window.localStorage).setItem('unitask_language', language); }
  catch { /* UI language still changes if optional preference storage is blocked. */ }
  return language;
}
