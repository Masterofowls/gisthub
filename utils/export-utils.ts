import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Gist, GistExport, CreateGistPayload } from '../types/github';

// ── Export ─────────────────────────────────────────────────────────────────
export async function exportGistsAsJSON(gists: Gist[]): Promise<void> {
  const data: GistExport = {
    exported_at: new Date().toISOString(),
    version: '1.0.0',
    gists,
  };
  const path = FileSystem.cacheDirectory + `gisthub-export-${Date.now()}.json`;
  await FileSystem.writeAsStringAsync(path, JSON.stringify(data, null, 2));
  await Sharing.shareAsync(path, {
    mimeType: 'application/json',
    dialogTitle: 'Export Gists',
    UTI: 'public.json',
  });
}

export async function exportGistAsFiles(gist: Gist): Promise<void> {
  const dir = FileSystem.cacheDirectory + `gist-${gist.id}-${Date.now()}/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

  for (const [filename, file] of Object.entries(gist.files)) {
    if (file.content) {
      await FileSystem.writeAsStringAsync(dir + filename, file.content);
    }
  }

  // Share the first file or a zip-like bundle
  const files = Object.entries(gist.files);
  if (files.length === 1) {
    const [filename, file] = files[0];
    if (file.content) {
      const path = dir + filename;
      await Sharing.shareAsync(path, { dialogTitle: `Share ${filename}` });
    }
  } else {
    // Share as JSON if multiple files
    await exportGistsAsJSON([gist]);
  }
}

// ── Import ─────────────────────────────────────────────────────────────────
export async function importGistsFromJSON(): Promise<CreateGistPayload[]> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });

  if (result.canceled) return [];

  const file = result.assets?.[0];
  if (!file?.uri) return [];

  const content = await FileSystem.readAsStringAsync(file.uri);
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Invalid JSON file');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid export format');
  }

  const exportData = parsed as Partial<GistExport>;

  if (!Array.isArray(exportData.gists)) {
    throw new Error('No gists array found in file');
  }

  return exportData.gists.map((g: Gist) => ({
    description: g.description ?? '',
    public: g.public ?? false,
    files: Object.fromEntries(
      Object.entries(g.files).map(([name, f]) => [name, { content: f.content ?? '' }])
    ),
  }));
}

export async function importSingleFile(): Promise<{ filename: string; content: string } | null> {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
  });

  if (result.canceled) return null;
  const file = result.assets?.[0];
  if (!file?.uri) return null;

  const content = await FileSystem.readAsStringAsync(file.uri);
  return { filename: file.name ?? 'untitled.txt', content };
}
