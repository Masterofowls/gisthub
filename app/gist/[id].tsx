import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Linking,
  Share,
  useColorScheme,
} from 'react-native';
import {
  Appbar,
  Text,
  Chip,
  IconButton,
  Divider,
  useTheme,
  ActivityIndicator,
  Snackbar,
  FAB,
  Surface,
  Portal,
  Dialog,
  Button,
  Menu,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/auth-context';
import { useGist } from '../../hooks/use-gist';
import { useGists } from '../../hooks/use-gists';
import { CodeViewer } from '../../components/code-viewer';
import { EmptyState } from '../../components/empty-state';
import { exportGistAsFiles } from '../../utils/export-utils';
import { starGist, unstarGist, forkGist } from '../../services/github-api';
import { GistFile } from '../../types/github';

export default function GistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, user } = useAuth();
  const theme = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const { gist, starred, setStarred, isLoading, error, load } = useGist(token);
  const { remove } = useGists(token);

  const [menuVisible, setMenuVisible] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [snack, setSnack] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const showSnack = (msg: string) => {
    setSnack(msg);
    setSnackVisible(true);
  };

  useEffect(() => {
    if (id) load(id);
  }, [id, load]);

  const files = gist ? Object.values(gist.files) : [];
  const activeFile = files.find((f) => f.filename === selectedFile) ?? files[0];
  const isOwner = user?.login === gist?.owner?.login;

  const handleStar = async () => {
    if (!token || !id) return;
    try {
      if (starred) {
        await unstarGist(token, id);
        setStarred(false);
        showSnack('Unstarred');
      } else {
        await starGist(token, id);
        setStarred(true);
        showSnack('Starred!');
      }
    } catch {
      showSnack('Failed to update star');
    }
  };

  const handleFork = async () => {
    if (!token || !id) return;
    setMenuVisible(false);
    try {
      const forked = await forkGist(token, id);
      showSnack('Forked!');
      router.replace(`/gist/${forked.id}`);
    } catch {
      showSnack('Fork failed');
    }
  };

  const handleCopyURL = () => {
    setMenuVisible(false);
    if (gist?.html_url) {
      Clipboard.setStringAsync(gist.html_url);
      showSnack('URL copied');
    }
  };

  const handleShare = () => {
    setMenuVisible(false);
    if (gist?.html_url) {
      Share.share({ url: gist.html_url, message: gist.description || gist.html_url });
    }
  };

  const handleExport = async () => {
    setMenuVisible(false);
    if (!gist) return;
    try {
      await exportGistAsFiles(gist);
    } catch {
      showSnack('Export failed');
    }
  };

  const handleDelete = async () => {
    setDeleteDialog(false);
    if (!id) return;
    try {
      await remove(id);
      router.back();
    } catch {
      showSnack('Delete failed');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
          <Appbar.BackAction onPress={() => router.back()} />
        </Appbar.Header>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !gist) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
          <Appbar.BackAction onPress={() => router.back()} />
        </Appbar.Header>
        <EmptyState icon="alert-circle-outline" title={error || 'Gist not found'} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content
          title={gist.description || files[0]?.filename || 'Gist'}
          titleStyle={{ fontSize: 16, fontWeight: '600' }}
          subtitle={`@${gist.owner?.login}`}
          subtitleStyle={{ fontSize: 12 }}
        />
        <Appbar.Action
          icon={starred ? 'star' : 'star-outline'}
          color={starred ? '#FFB000' : undefined}
          onPress={handleStar}
        />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Appbar.Action icon="dots-vertical" onPress={() => setMenuVisible(true)} />
          }
        >
          {isOwner && (
            <Menu.Item
              leadingIcon="pencil"
              title="Edit"
              onPress={() => { setMenuVisible(false); router.push(`/gist/edit/${id}`); }}
            />
          )}
          <Menu.Item leadingIcon="source-fork" title="Fork" onPress={handleFork} />
          <Menu.Item leadingIcon="content-copy" title="Copy URL" onPress={handleCopyURL} />
          <Menu.Item leadingIcon="share-variant" title="Share" onPress={handleShare} />
          <Menu.Item leadingIcon="export" title="Export" onPress={handleExport} />
          <Menu.Item
            leadingIcon="open-in-new"
            title="Open in Browser"
            onPress={() => { setMenuVisible(false); Linking.openURL(gist.html_url); }}
          />
          {isOwner && (
            <>
              <Divider />
              <Menu.Item
                leadingIcon="delete"
                title="Delete"
                titleStyle={{ color: theme.colors.error }}
                onPress={() => { setMenuVisible(false); setDeleteDialog(true); }}
              />
            </>
          )}
        </Menu>
      </Appbar.Header>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Meta */}
        <View style={styles.meta}>
          <Chip compact icon={gist.public ? 'earth' : 'lock'} style={{ marginRight: 8 }}>
            {gist.public ? 'Public' : 'Secret'}
          </Chip>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Updated {formatDistanceToNow(new Date(gist.updated_at), { addSuffix: true })}
          </Text>
        </View>

        {/* File tabs (when multiple files) */}
        {files.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.fileTabs}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }}
          >
            {files.map((f) => (
              <Chip
                key={f.filename}
                selected={f.filename === (selectedFile ?? files[0]?.filename)}
                onPress={() => setSelectedFile(f.filename)}
                compact
              >
                {f.filename}
              </Chip>
            ))}
          </ScrollView>
        )}

        {/* Code viewer */}
        {activeFile && (
          <View style={{ paddingHorizontal: 12, marginTop: 8 }}>
            <CodeViewer file={activeFile} isDark={isDark} />
          </View>
        )}
      </ScrollView>

      {/* Delete dialog */}
      <Portal>
        <Dialog visible={deleteDialog} onDismiss={() => setDeleteDialog(false)}>
          <Dialog.Title>Delete gist?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">This action cannot be undone.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialog(false)}>Cancel</Button>
            <Button textColor={theme.colors.error} onPress={handleDelete}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={snackVisible} onDismiss={() => setSnackVisible(false)} duration={2500}>
        {snack}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  fileTabs: {
    marginTop: 12,
  },
});
