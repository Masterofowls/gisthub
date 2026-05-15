import React, { useEffect, useState, useCallback } from 'react';
import {
  FlatList,
  View,
  StyleSheet,
  RefreshControl,
  TextInput as RNTextInput,
} from 'react-native';
import {
  FAB,
  Appbar,
  useTheme,
  Searchbar,
  Menu,
  Snackbar,
  ActivityIndicator,
  Text,
  Portal,
  Dialog,
  Button,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../context/auth-context';
import { useGists } from '../../hooks/use-gists';
import { GistCard } from '../../components/gist-card';
import { EmptyState } from '../../components/empty-state';
import { exportGistsAsJSON, importGistsFromJSON } from '../../utils/export-utils';
import { Gist } from '../../types/github';

export default function GistsScreen() {
  const theme = useTheme();
  const { token } = useAuth();
  const {
    gists,
    isLoading,
    isRefreshing,
    error,
    loadGists,
    remove,
    create,
  } = useGists(token);

  const [search, setSearch] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [longPressGist, setLongPressGist] = useState<Gist | null>(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [snack, setSnack] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);

  const showSnack = (msg: string) => {
    setSnack(msg);
    setSnackVisible(true);
  };

  useEffect(() => {
    loadGists();
  }, [loadGists]);

  const filtered = gists.filter((g) => {
    const q = search.toLowerCase();
    if (!q) return true;
    const desc = (g.description ?? '').toLowerCase();
    const files = Object.keys(g.files).join(' ').toLowerCase();
    return desc.includes(q) || files.includes(q);
  });

  const handleDelete = async () => {
    if (!longPressGist) return;
    setDeleteDialogVisible(false);
    try {
      await remove(longPressGist.id);
      showSnack('Gist deleted');
    } catch {
      showSnack('Failed to delete gist');
    }
    setLongPressGist(null);
  };

  const handleExport = async () => {
    setMenuVisible(false);
    try {
      await exportGistsAsJSON(gists);
    } catch {
      showSnack('Export failed');
    }
  };

  const handleImport = async () => {
    setMenuVisible(false);
    try {
      const payloads = await importGistsFromJSON();
      let count = 0;
      for (const p of payloads) {
        await create(p);
        count++;
      }
      if (count) showSnack(`Imported ${count} gist(s)`);
    } catch (e: unknown) {
      showSnack(e instanceof Error ? e.message : 'Import failed');
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.Content title="My Gists" titleStyle={{ fontWeight: '700' }} />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Appbar.Action icon="dots-vertical" onPress={() => setMenuVisible(true)} />
          }
        >
          <Menu.Item leadingIcon="upload" onPress={handleExport} title="Export All" />
          <Menu.Item leadingIcon="download" onPress={handleImport} title="Import JSON" />
          <Menu.Item
            leadingIcon="refresh"
            onPress={() => { setMenuVisible(false); loadGists(true); }}
            title="Refresh"
          />
        </Menu>
      </Appbar.Header>

      <Searchbar
        placeholder="Search gists…"
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />

      {isLoading && !gists.length ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : error ? (
        <EmptyState
          icon="alert-circle-outline"
          title="Error loading gists"
          description={error}
          actionLabel="Retry"
          onAction={() => loadGists(true)}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(g) => g.id}
          renderItem={({ item }) => (
            <GistCard
              gist={item}
              onPress={() => router.push(`/gist/${item.id}`)}
              onLongPress={() => {
                setLongPressGist(item);
                setDeleteDialogVisible(true);
              }}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              title={search ? 'No matching gists' : 'No gists yet'}
              description={search ? 'Try a different search term' : 'Tap + to create your first gist'}
              {...(!search ? { actionLabel: 'Create Gist', onAction: () => router.push('/gist/create') } : {})}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadGists(true)}
              colors={[theme.colors.primary]}
            />
          }
          contentContainerStyle={filtered.length === 0 ? { flex: 1 } : { paddingBottom: 88 }}
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primaryContainer }]}
        color={theme.colors.onPrimaryContainer}
        onPress={() => router.push('/gist/create')}
      />

      {/* Long-press action dialog */}
      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>Delete gist?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              {longPressGist?.description || longPressGist?.id}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button
              textColor={theme.colors.error}
              onPress={handleDelete}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackVisible}
        onDismiss={() => setSnackVisible(false)}
        duration={2500}
      >
        {snack}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  search: {
    margin: 12,
    borderRadius: 28,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
