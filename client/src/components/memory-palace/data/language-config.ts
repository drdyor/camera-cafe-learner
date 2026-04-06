import type { SupportedLanguage, LanguageConfig } from './types';

export const LANGUAGES: Record<SupportedLanguage, LanguageConfig> = {
  it: { code: 'it', name: 'Italiano', genderLabels: { m: 'maschile', f: 'femminile' }, speechLang: 'it-IT' },
  fr: { code: 'fr', name: 'Français', genderLabels: { m: 'masculin', f: 'féminin' }, speechLang: 'fr-FR' },
  es: { code: 'es', name: 'Español', genderLabels: { m: 'masculino', f: 'femenino' }, speechLang: 'es-ES' },
  zh: { code: 'zh', name: '中文', genderLabels: { m: '', f: '' }, speechLang: 'zh-CN' },
};
