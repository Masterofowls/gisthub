import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Appbar,
  TextInput,
  Switch,
  Text,
  useTheme,
  Snackbar,
  ActivityIndicator,
  Button,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../context/auth-context';
import { useGists } from '../../hooks/use-gists';
import { FileEditor } from '../../components/file-editor';
import { importSingleFile } from '../../utils/export-utils';
import { getLanguageFromFilename } from '../../constants/languages';

interface FileEntry {
  filename: string;
  content: string;
  language?: string;
}

export default function CreateGistScreen() {
  const theme = useTheme();
  const { token } = useAuth();
  const { create } = useGists(token);

  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [files, setFiles] = useState<FileEntry[]>([
    { filename: 'gist.txt', content: '', language: 'plaintext' },
  ]);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);

  const showSnack = (msg: string) => {
    setSnack(msg);
    setSnackVisible(true);
  };

  const isValid = files.some((f) => f.filename.trim() && f.content.trim());

  const handleSave = async () => {
    if (!isValid) {
      showSnack('Add at least one file with content');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        description,
        public: isPublic,
        files: Object.fromEntries(
          files
            .filter((f) => f.filename.trim() && f.content.trim())
            .map((f) => [f.filename.trim(), { content: f.content }])
        ),
      };
      const gist = await create(payload);
      router.replace(`/gist/${gist.id}`);
    } catch (e: unknown) {
      showSnack(e instanceof Error ? e.message : 'Failed to create gist');
    } finally {
      setSaving(false);
    }
  };

  const handlePaste = async () => {
    try {
      const imported = await importSingleFile();
      if (imported) {
        const lang = getLanguageFromFilename(imported.filename);
        setFiles((prev) => [
          ...prev.filter((f) => f.filename !== 'gist.txt' || f.content),
          { filename: imported.filename, content: imported.content, language: lang },
        ]);
        showSnack(`Imported ${imported.filename}`);
      }
    } catch {
      showSnack('Import failed');
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.Action icon="close" onPress={() => router.back()} />
        <Appbar.Content title="New Gist" titleStyle={{ fontWeight: '700' }} />
        <Appbar.Action icon="file-import" onPress={handlePaste} />
        {saving ? (
          <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginRight: 12 }} />
        ) : (
          <Appbar.Action icon="check" onPress={handleSave} disabled={!isValid} />
        )}
      </Appbar.Header>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TextInput
            label="Description (optional)"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            style={styles.field}
          />

          <View style={styles.visibilityRow}>
            <View style={styles.visibilityLabel}>
              <Text variant="titleSmall">Public gist</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {isPublic ? 'Visible to everyone' : 'Only visible with direct link'}
              </Text>
            </View>
            <Switch value={isPublic} onValueChange={setIsPublic} />
          </View>

          <Divider style={{ marginVertical: 12 }} />

          <FileEditor files={files} onChange={setFiles} />

          <Button
            mode="contained"
            onPress={handleSave}
            disabled={!isValid || saving}
            loading={saving}
            style={styles.saveBtn}
            contentStyle={{ height: 48 }}
          >
            Create Gist
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar visible={snackVisible} onDismiss={() => setSnackVisible(false)} duration={2500}>
        {snack}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  field: { marginBottom: 12 },
  visibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  visibilityLabel: { flex: 1, marginRight: 12 },
  saveBtn: { marginTop: 16 },
});
