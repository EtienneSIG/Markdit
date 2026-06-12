/**
 * Minimal localization scaffold (Principle VI — EU/NA reach; FR-016).
 * English and French strings are bundled; more locales can be added without
 * code changes. No content is sent anywhere for translation.
 */
export type Locale = 'en' | 'fr';

type Dict = Record<string, string>;

const STRINGS: Record<Locale, Dict> = {
  en: {
    'app.title': 'Markdit',
    'toolbar.bold': 'Bold',
    'toolbar.italic': 'Italic',
    'action.open': 'Open',
    'action.save': 'Save',
    'action.export': 'Export',
    'view.read': 'Read',
    'view.edit': 'Edit',
    'view.source': 'Source',
    'notice.remoteBlocked':
      'Remote content is blocked. Enable it in Settings to load remote images.',
    'notice.enableRemote': 'Enable remote content',
    'export.word': 'Export to Word',
  },
  fr: {
    'app.title': 'Markdit',
    'toolbar.bold': 'Gras',
    'toolbar.italic': 'Italique',
    'action.open': 'Ouvrir',
    'action.save': 'Enregistrer',
    'action.export': 'Exporter',
    'view.read': 'Lecture',
    'view.edit': 'Édition',
    'view.source': 'Source',
    'notice.remoteBlocked':
      'Le contenu distant est bloqué. Activez-le dans les Réglages pour charger les images distantes.',
    'notice.enableRemote': 'Activer le contenu distant',
    'export.word': 'Exporter vers Word',
  },
};

let current: Locale = 'en';

export function setLocale(locale: string): void {
  current = locale.startsWith('fr') ? 'fr' : 'en';
}

export function t(key: string): string {
  return STRINGS[current][key] ?? STRINGS.en[key] ?? key;
}
