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
    'action.saving': 'Saving…',
    'action.saved': 'Saved',
    'action.saveFailed': 'Save failed.',
    'action.copy': 'Copy',
    'action.copied': 'Copied — paste into OneNote, Word or Loop.',
    'action.copyFailed': 'Copy failed.',
    'action.autosave': 'Auto-save',
    'action.autosaveOn': 'Auto-save on — click to disable',
    'action.autosaveOff': 'Auto-save off — click to enable',
    'share.title': 'Share',
    'share.email': 'Send by email',
    'share.download': 'Download (.md)',
    'share.opening': 'Opening email…',
    'share.failed': 'Sharing failed',
    'share.mailBody':
      'The Markdown file "{name}" has been downloaded to your computer. Please attach it to this email before sending.',
    'view.read': 'Read',
    'view.edit': 'Edit',
    'view.source': 'Source',
    'view.mode': 'View mode',
    'ribbon.group.font': 'Font',
    'ribbon.group.paragraph': 'Paragraph',
    'ribbon.group.insert': 'Insert',
    'ribbon.group.table': 'Table',
    'table.insert': 'Insert table',
    'table.addRow': 'Add row below',
    'table.deleteRow': 'Delete row',
    'table.addColumn': 'Add column right',
    'table.deleteColumn': 'Delete column',
    'table.delete': 'Delete table',
    'editor.label': 'Markdown editor',
    'notice.remoteBlocked':
      'Remote content is blocked. Enable it in Settings to load remote images.',
    'notice.enableRemote': 'Enable remote content',
    'notice.largeFile':
      'This file is large; syntax highlighting is disabled to keep it responsive.',
    'update.available': 'A new version of Markdit is available.',
    'update.availableVersion': 'Markdit {version} is available.',
    'update.install': 'Update now',
    'update.installing': 'Updating…',
    'update.failed': 'The update could not be installed. Please try again later.',
    'update.dismiss': 'Dismiss',
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
    'sidebar.resize': 'Resize file navigation (drag, or arrow keys)',
    'sidebar.files': 'Files',
    'sidebar.openFolder': 'Open folder',
    'sidebar.openFiles': 'Open files',
    'sidebar.refresh': 'Refresh tree',
    'sidebar.filesGroup': 'Files',
    'sidebar.removeRoot': 'Remove “{name}”',
    'sidebar.rootEmpty': 'No Markdown files here.',
    'sidebar.empty': 'Open a folder or files to browse your Markdown.',
    'sidebar.unsupported': 'Folder browsing is not supported in this environment. Use Open instead.',
    'sidebar.reopen': 'Reopen “{name}”',
    'conflict.title': 'File changed on disk',
    'conflict.body':
      'This file was modified outside Markdit. Reload the version on disk (your unsaved changes will be lost) or keep editing your version.',
    'conflict.reload': 'Reload from disk',
    'conflict.keep': 'Keep my version',
    'lang.label': 'Language',
    'lang.switchTo': 'Switch to French',
    'lang.current': 'English',
    'footer.license': 'License',
    'footer.version': 'Version {version}',
    'footer.check.checking': 'Checking for updates…',
    'footer.check.upToDate': 'Up to date',
    'footer.check.available': 'Update available',
    'footer.check.unavailable': 'Update check unavailable',
    'footer.check.idle': 'Check for updates',
    'footer.update.badge': 'v{version} available',
  },
  fr: {
    'app.title': 'Markdit',
    'toolbar.bold': 'Gras',
    'toolbar.italic': 'Italique',
    'action.open': 'Ouvrir',
    'action.save': 'Enregistrer',
    'action.saving': 'Enregistrement…',
    'action.saved': 'Enregistré',
    'action.saveFailed': "Échec de l'enregistrement.",
    'action.copy': 'Copier',
    'action.copied': 'Copié — collez dans OneNote, Word ou Loop.',
    'action.copyFailed': 'Échec de la copie.',
    'action.autosave': 'Auto',
    'action.autosaveOn': 'Enregistrement auto activé — cliquez pour désactiver',
    'action.autosaveOff': 'Enregistrement auto désactivé — cliquez pour activer',
    'share.title': 'Partager',
    'share.email': 'Envoyer par mail',
    'share.download': 'Télécharger (.md)',
    'share.opening': 'Ouverture du client mail…',
    'share.failed': 'Échec du partage',
    'share.mailBody':
      'Le fichier Markdown « {name} » a été téléchargé sur votre ordinateur. Veuillez le joindre à cet e-mail avant de l’envoyer.',
    'view.read': 'Lecture',
    'view.edit': 'Édition',
    'view.source': 'Source',
    'view.mode': 'Mode d’affichage',
    'ribbon.group.font': 'Police',
    'ribbon.group.paragraph': 'Paragraphe',
    'ribbon.group.insert': 'Insérer',
    'ribbon.group.table': 'Tableau',
    'table.insert': 'Insérer un tableau',
    'table.addRow': 'Ajouter une ligne en dessous',
    'table.deleteRow': 'Supprimer la ligne',
    'table.addColumn': 'Ajouter une colonne à droite',
    'table.deleteColumn': 'Supprimer la colonne',
    'table.delete': 'Supprimer le tableau',
    'editor.label': 'Éditeur Markdown',
    'notice.remoteBlocked':
      'Le contenu distant est bloqué. Activez-le dans les Réglages pour charger les images distantes.',
    'notice.enableRemote': 'Activer le contenu distant',
    'notice.largeFile':
      'Ce fichier est volumineux ; la coloration syntaxique est désactivée pour rester réactif.',
    'update.available': 'Une nouvelle version de Markdit est disponible.',
    'update.availableVersion': 'Markdit {version} est disponible.',
    'update.install': 'Mettre à jour',
    'update.installing': 'Mise à jour…',
    'update.failed': "La mise à jour n'a pas pu être installée. Veuillez réessayer plus tard.",
    'update.dismiss': 'Ignorer',
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
    'sidebar.resize': 'Redimensionner la navigation (glisser ou flèches)',
    'sidebar.files': 'Fichiers',
    'sidebar.openFolder': 'Ouvrir un dossier',
    'sidebar.openFiles': 'Ouvrir des fichiers',
    'sidebar.refresh': "Rafraîchir l'arborescence",
    'sidebar.filesGroup': 'Fichiers',
    'sidebar.removeRoot': 'Retirer « {name} »',
    'sidebar.rootEmpty': 'Aucun fichier Markdown ici.',
    'sidebar.empty': 'Ouvrez un dossier ou des fichiers pour parcourir votre Markdown.',
    'sidebar.unsupported':
      "La navigation par dossier n'est pas prise en charge dans cet environnement. Utilisez Ouvrir.",
    'sidebar.reopen': 'Rouvrir « {name} »',
    'conflict.title': 'Fichier modifié sur le disque',
    'conflict.body':
      "Ce fichier a été modifié en dehors de Markdit. Rechargez la version du disque (vos modifications non enregistrées seront perdues) ou continuez avec votre version.",
    'conflict.reload': 'Recharger depuis le disque',
    'conflict.keep': 'Conserver ma version',
    'lang.label': 'Langue',
    'lang.switchTo': 'Passer en anglais',
    'lang.current': 'Français',
    'footer.license': 'Licence',
    'footer.version': 'Version {version}',
    'footer.check.checking': 'Recherche de mises à jour…',
    'footer.check.upToDate': 'À jour',
    'footer.check.available': 'Mise à jour disponible',
    'footer.check.unavailable': 'Vérification indisponible',
    'footer.check.idle': 'Rechercher des mises à jour',
    'footer.update.badge': 'v{version} disponible',
  },
};

let current: Locale = 'en';

export function setLocale(locale: string): void {
  current = locale.startsWith('fr') ? 'fr' : 'en';
}

export function getLocale(): Locale {
  return current;
}

export function t(key: string, vars?: Record<string, string | number>): string {
  let str = STRINGS[current][key] ?? STRINGS.en[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\\{${name}\\}`, 'g'), String(value));
    }
  }
  return str;
}
