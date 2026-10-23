// @ts-nocheck Bun supplies this test module at runtime; it is not a browser dependency.
import { describe, expect, it } from 'bun:test';
import { readLanguagePreference, saveLanguagePreference } from './preferences';
import { interfaceTranslations } from './interfaceTranslations';
import {
  localizeText,
  normalizeLanguage,
  syncDocumentLanguage,
  toUzbekCyrillic,
  toUzbekLatin,
} from './i18n';

describe('language selection and script handling', () => {
  it('normalizes canonical and previously stored language values', () => {
    expect(normalizeLanguage('uz-Latn')).toBe('uz-Latn');
    expect(normalizeLanguage('uz-Cyrl')).toBe('uz-Cyrl');
    expect(normalizeLanguage('uz_latn')).toBe('uz-Latn');
    expect(normalizeLanguage('uz_cyrl')).toBe('uz-Cyrl');
    expect(normalizeLanguage('unknown')).toBe('uz-Latn');
  });

  it('transliterates Uzbek without leaving the other Uzbek script in the text', () => {
    const cyrillic = toUzbekCyrillic("O'zbekiston Respublikasi");
    const latin = toUzbekLatin('Ўзбекистон Республикаси');

    expect(cyrillic).toBe('Ўзбекистон Республикаси');
    expect(latin).toBe('Oʻzbekiston Respublikasi');
    expect(cyrillic).not.toMatch(/[A-Za-z]/);
    expect(latin).not.toMatch(/[А-Яа-яЁёҚқҒғЎўҲҳ]/);
    expect(localizeText('Ish reja vazifalari', 'uz-Cyrl')).toBe('Иш режа вазифалари');
    expect(localizeText('Ўзбекча', 'uz-Latn')).toBe('Oʻzbekcha');
  });

  it('updates the document language synchronously and translates common labels', () => {
    const previousDocument = globalThis.document;
    const documentElement = { lang: 'en', dir: 'rtl' };
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: { documentElement },
    });

    try {
      expect(syncDocumentLanguage('uz-Cyrl')).toBe('uz-Cyrl');
      expect(documentElement).toEqual({ lang: 'uz-Cyrl', dir: 'ltr' });
      expect(localizeText('Boshqaruv Paneli', 'en')).toBe('Dashboard');
      expect(localizeText('Ish Reja Vazifalari', 'ru')).toBe('Задачи рабочего плана');
      expect(localizeText('PENDING', 'uz-Cyrl')).toBe('Кутилмоқда');
      expect(localizeText('Nusxalash', 'uz-Latn')).toBe('Nusxalash');
      expect(localizeText('jasur_toshtech', 'uz-Cyrl')).toBe('jasur_toshtech');
      expect(localizeText('Boshqaruv Paneli')).toBe('Бошқарув панели');
      syncDocumentLanguage('en');
      expect(localizeText('Boshqaruv Paneli')).toBe('Dashboard');
      expect(
        localizeText(
          "Matnli xulosa kamida 20 belgidan iborat bo'lishi shart! (Hozir: 12 ta)",
          'en',
        ),
      ).toBe('The summary must contain at least 20 characters (currently 12).');
      expect(
        localizeText('«TT-2026-01» топшириғи муҳимлиги HIGH га ўзгартирилди', 'en'),
      ).toBe('Priority for task TT-2026-01 changed to High.');
    } finally {
      if (previousDocument) {
        Object.defineProperty(globalThis, 'document', { configurable: true, value: previousDocument });
      } else {
        Reflect.deleteProperty(globalThis, 'document');
      }
    }
  });

  it('has English, Russian, and Uzbek Latin entries for every UI catalog item', () => {
    for (const [source, translations] of Object.entries(interfaceTranslations)) {
      expect(translations.en, source).toBeTruthy();
      expect(translations.ru, source).toBeTruthy();
      expect(translations['uz-Latn'], source).toBeTruthy();
    }
  });
  it('retranslates already displayed notices and API errors after a language switch', () => {
    const uzbek = localizeText('Invalid credentials or account unavailable.','uz-Latn');
    expect(localizeText(uzbek,'en')).toBe('Invalid credentials or account unavailable.');
    const cyrillic = localizeText('This task changed on another device. Reload it before saving.','uz-Cyrl');
    expect(localizeText(cyrillic,'uz-Latn')).not.toMatch(/[А-Яа-яЁёҚқҒғЎўҲҳ]/);
    expect(localizeText('Row 2: Choose an active assignee.','ru')).toBe('Строка 2: Выберите активного исполнителя.');
    expect(localizeText('New task assigned: Task 12. Deadline: 2028-12-31','uz-Cyrl')).not.toMatch(/Deadline|New task/);
    expect(localizeText('DEADLINE_WARNING_2H','uz-Latn')).toBe('Muddat eslatmasi');
  });
});

describe('language persistence', () => {
  it('stores only the language preference without altering legacy records or identity', () => {
    const values = new Map([['unitask_app_data_v1','unchanged original records']]);
    const storage = { getItem: key => values.get(key) ?? null, setItem: (key,value) => values.set(key,value) };
    saveLanguagePreference('uz-Cyrl',storage); expect(readLanguagePreference(storage)).toBe('uz-Cyrl');
    values.set('unitask_language','uz_latn'); expect(readLanguagePreference(storage)).toBe('uz-Latn');
    values.set('unitask_language','invalid'); expect(readLanguagePreference(storage)).toBe('uz-Latn');
    expect(values.get('unitask_app_data_v1')).toBe('unchanged original records');
    expect([...values.keys()]).toEqual(['unitask_app_data_v1','unitask_language']);
  });
  it('still switches language when optional preference storage is blocked', () => {
    const blocked = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    expect(saveLanguagePreference('uz-Cyrl',blocked)).toBe('uz-Cyrl');
    expect(readLanguagePreference(blocked)).toBe('uz-Latn');
  });
});
