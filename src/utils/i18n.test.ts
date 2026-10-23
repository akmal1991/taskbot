// @ts-nocheck Bun supplies this test module at runtime; it is not a browser dependency.
import { describe, expect, it } from 'bun:test';
import { loadAppData, saveAppData } from './appStorage';
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
});

describe('language persistence', () => {
  it('persists the selected language and migrates legacy or invalid locale values without discarding data', () => {
    const previousWindow = globalThis.window;
    const values = new Map<string, string>();
    const localStorageMock = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { localStorage: localStorageMock },
    });

    try {
      const initial = loadAppData();
      saveAppData({ ...initial, language: 'uz-Cyrl' });
      expect(loadAppData().language).toBe('uz-Cyrl');

      const stored = JSON.parse(values.get('unitask_app_data_v1') as string);
      stored.language = 'uz_cyrl';
      values.set('unitask_app_data_v1', JSON.stringify(stored));
      const migrated = loadAppData();
      expect(migrated.language).toBe('uz-Cyrl');
      expect(migrated.tasks).toHaveLength(initial.tasks.length);
      expect(migrated.storageStatus).toBe('saved');

      stored.language = 'not-a-locale';
      values.set('unitask_app_data_v1', JSON.stringify(stored));
      const recovered = loadAppData();
      expect(recovered.language).toBe('uz-Latn');
      expect(recovered.tasks).toHaveLength(initial.tasks.length);
      expect(recovered.storageStatus).toBe('saved');
    } finally {
      if (previousWindow) {
        Object.defineProperty(globalThis, 'window', { configurable: true, value: previousWindow });
      } else {
        Reflect.deleteProperty(globalThis, 'window');
      }
    }
  });
});
