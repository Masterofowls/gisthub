import React, { useState, useEffect } from 'react';
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
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '../../../context/auth-context';
import { useGists } from '../../../hooks/use-gists';
import { useGist } from '../../../hooks/use-gist';
import { FileEditor } from '../../../components/file-editor';
import { getLanguageFromFilename } from '../../../constants/languages';

interface FileEntry {
  filename: string;
  content: string;
  language?: string;
}

export default function EditGistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { token } = useAuth();
  const { update } = useGists(token);
  const { gist, isLoading, load } = useGist(token);

  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);

  useEffect(() => {
    if (id) load(id);
  }, [id, load]);

  useEffect(() => {
    if (gist) {
      setDescription(gist.description ?? '');
      setIsPublic(gist.public);
      setFiles(
        Object.values(gist.files).map((f) => ({
          filename: f.filename,
          content: f.content ?? '',
          language: f.language ? f.language.toLowerCase() : getLanguageFromFilename(f.filename),
        }))
      );
    }
  }, [gist]);

  const isValid = files.some((f) => f.filename.trim() && f.content.trim());

  const handleSave = async () => {
    if (!isValid || !id) return;
    setSaving(true);
    try {
      const payload = {
        description,
        files: Object.fromEntries(
          files
            .filter((f) => f.filename.trim())
            .map((f) => [f.filename.trim(), f.content.trim() ? { content: f.content } : null])
        ) as Record<string, { content: string } | null>,
      };
      await update(id, payload);
      router.back();
    } catch (e: unknown) {
      setSnack(e instanceof Error ? e.message : 'Failed to update gist');
      setSnackVisible(true);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
          <Appbar.Action icon="close" onPress={() => router.back()} />
          <Appbar.Content title="Edit Gist" />
        </Appbar.Header>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.Action icon="close" onPress={() => router.back()} />
        <Appbar.Content title="Edit Gist" titleStyle={{ fontWeight: '700' }} />
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
            Save Changes
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
