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
    'editor.label': 'Markdown editor',
    'notice.remoteBlocked':
      'Remote content is blocked. Enable it in Settings to load remote images.',
    'notice.enableRemote': 'Enable remote content',
    'notice.largeFile':
      'This file is large; syntax highlighting is disabled to keep it responsive.',
    'export.word': 'Export to Word',
    'export.title': 'Export document',
    'export.target': 'Destination',
    'export.run': 'Export',
    'export.cancel': 'Cancel',
    'export.close': 'Close',
    'export.consentNeeded': 'This destination needs your consent before any content leaves your device.',
    'export.grantConsent': 'Grant consent and continue',
    'export.dropped': 'Some elements are not supported and will be omitted:',
    'export.success': 'Export complete.',
    'export.failed': 'Export failed.',
    'sidebar.title': 'File navigation',
    'sidebar.files': 'Files',
    'sidebar.openFolder': 'Open folder',
    'sidebar.empty': 'Open a folder to browse your Markdown files.',
    'sidebar.unsupported': 'Folder browsing is not supported in this environment. Use Open instead.',
    'conflict.title': 'File changed on disk',
    'conflict.body':
      'This file was modified outside Markdit. Reload the version on disk (your unsaved changes will be lost) or keep editing your version.',
    'conflict.reload': 'Reload from disk',
    'conflict.keep': 'Keep my version',
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
    'editor.label': 'Éditeur Markdown',
    'notice.remoteBlocked':
      'Le contenu distant est bloqué. Activez-le dans les Réglages pour charger les images distantes.',
    'notice.enableRemote': 'Activer le contenu distant',
    'notice.largeFile':
      'Ce fichier est volumineux ; la coloration syntaxique est désactivée pour rester réactif.',
    'export.word': 'Exporter vers Word',
    'export.title': 'Exporter le document',
    'export.target': 'Destination',
    'export.run': 'Exporter',
    'export.cancel': 'Annuler',
    'export.close': 'Fermer',
    'export.consentNeeded':
      'Cette destination nécessite votre consentement avant que tout contenu ne quitte votre appareil.',
    'export.grantConsent': 'Consentir et continuer',
    'export.dropped': 'Certains éléments ne sont pas pris en charge et seront omis :',
    'export.success': 'Export terminé.',
    'export.failed': "Échec de l'export.",
    'sidebar.title': 'Navigation des fichiers',
    'sidebar.files': 'Fichiers',
    'sidebar.openFolder': 'Ouvrir un dossier',
    'sidebar.empty': 'Ouvrez un dossier pour parcourir vos fichiers Markdown.',
    'sidebar.unsupported':
      "La navigation par dossier n'est pas prise en charge dans cet environnement. Utilisez Ouvrir.",
    'conflict.title': 'Fichier modifié sur le disque',
    'conflict.body':
      "Ce fichier a été modifié en dehors de Markdit. Rechargez la version du disque (vos modifications non enregistrées seront perdues) ou continuez avec votre version.",
    'conflict.reload': 'Recharger depuis le disque',
    'conflict.keep': 'Conserver ma version',
  },
};

let current: Locale = 'en';

export function setLocale(locale: string): void {
  current = locale.startsWith('fr') ? 'fr' : 'en';
}

export function t(key: string): string {
  return STRINGS[current][key] ?? STRINGS.en[key] ?? key;
}
