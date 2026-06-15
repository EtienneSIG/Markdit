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
    'action.copy': 'Copy',
    'action.copied': 'Copied — paste into OneNote, Word or Loop.',
    'action.copyFailed': 'Copy failed.',
    'view.read': 'Read',
    'view.edit': 'Edit',
    'view.source': 'Source',
    'view.mode': 'View mode',
    'ribbon.group.font': 'Font',
    'ribbon.group.paragraph': 'Paragraph',
    'ribbon.group.insert': 'Insert',
    'editor.label': 'Markdown editor',
    'notice.remoteBlocked':
      'Remote content is blocked. Enable it in Settings to load remote images.',
    'notice.enableRemote': 'Enable remote content',
    'notice.largeFile':
      'This file is large; syntax highlighting is disabled to keep it responsive.',
    'action.slides': 'Slides',
    'slides.title': 'Generate slides (Marp)',
    'slides.preview': 'Slide preview',
    'slides.source': 'Marp Markdown source',
    'slides.theme': 'Theme',
    'slides.count': '{n} slide(s) generated as a Marp deck (marp: true front-matter, --- separated). Open it in Marp, VS Code, or marp.app.',
    'slides.copy': 'Copy Markdown',
    'slides.copied': 'Copied to clipboard.',
    'slides.download': 'Download .md',
    'slides.save': 'Save .md…',
    'slides.exportHtml': 'Export HTML',
    'slides.saved': 'Saved to',
    'slides.close': 'Close',
    'sidebar.title': 'File navigation',
    'sidebar.toggle': 'Toggle file navigation',
    'sidebar.files': 'Files',
    'sidebar.openFolder': 'Open folder',
    'sidebar.empty': 'Open a folder to browse your Markdown files.',
    'sidebar.unsupported': 'Folder browsing is not supported in this environment. Use Open instead.',
    'sidebar.reopen': 'Reopen “{name}”',
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
    'action.copy': 'Copier',
    'action.copied': 'Copié — collez dans OneNote, Word ou Loop.',
    'action.copyFailed': 'Échec de la copie.',
    'view.read': 'Lecture',
    'view.edit': 'Édition',
    'view.source': 'Source',
    'view.mode': 'Mode d’affichage',
    'ribbon.group.font': 'Police',
    'ribbon.group.paragraph': 'Paragraphe',
    'ribbon.group.insert': 'Insérer',
    'editor.label': 'Éditeur Markdown',
    'notice.remoteBlocked':
      'Le contenu distant est bloqué. Activez-le dans les Réglages pour charger les images distantes.',
    'notice.enableRemote': 'Activer le contenu distant',
    'notice.largeFile':
      'Ce fichier est volumineux ; la coloration syntaxique est désactivée pour rester réactif.',
    'action.slides': 'Diapositives',
    'slides.title': 'Générer des diapositives (Marp)',
    'slides.preview': 'Aperçu des diapositives',
    'slides.source': 'Source Markdown Marp',
    'slides.theme': 'Thème',
    'slides.count':
      '{n} diapositive(s) générée(s) au format Marp (en-tête marp: true, séparées par ---). Ouvrez-les dans Marp, VS Code ou marp.app.',
    'slides.copy': 'Copier le Markdown',
    'slides.copied': 'Copié dans le presse-papiers.',
    'slides.download': 'Télécharger .md',
    'slides.save': 'Enregistrer .md…',
    'slides.exportHtml': 'Exporter en HTML',
    'slides.saved': 'Enregistré dans',
    'slides.close': 'Fermer',
    'sidebar.title': 'Navigation des fichiers',
    'sidebar.toggle': 'Afficher/masquer la navigation',
    'sidebar.files': 'Fichiers',
    'sidebar.openFolder': 'Ouvrir un dossier',
    'sidebar.empty': 'Ouvrez un dossier pour parcourir vos fichiers Markdown.',
    'sidebar.unsupported':
      "La navigation par dossier n'est pas prise en charge dans cet environnement. Utilisez Ouvrir.",
    'sidebar.reopen': 'Rouvrir « {name} »',
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
