import React, { useEffect, useState } from 'react';
import { FlatList, View, StyleSheet, RefreshControl } from 'react-native';
import { Appbar, useTheme, ActivityIndicator, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../context/auth-context';
import { useGists } from '../../hooks/use-gists';
import { GistCard } from '../../components/gist-card';
import { EmptyState } from '../../components/empty-state';

export default function StarredScreen() {
  const theme = useTheme();
  const { token } = useAuth();
  const { starredGists, isLoading, loadStarred, unstar } = useGists(token);
  const [snack, setSnack] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStarred();
  }, [loadStarred]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStarred(true);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.Content title="Starred" titleStyle={{ fontWeight: '700' }} />
      </Appbar.Header>

      {isLoading && !starredGists.length ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={starredGists}
          keyExtractor={(g) => g.id}
          renderItem={({ item }) => (
            <GistCard
              gist={item}
              onPress={() => router.push(`/gist/${item.id}`)}
              onLongPress={async () => {
                await unstar(item.id);
                setSnack('Unstarred');
                setSnackVisible(true);
              }}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="star-outline"
              title="No starred gists"
              description="Star gists from the detail view to find them here"
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
            />
          }
          contentContainerStyle={starredGists.length === 0 ? { flex: 1 } : { paddingBottom: 16 }}
        />
      )}

      <Snackbar visible={snackVisible} onDismiss={() => setSnackVisible(false)} duration={2000}>
        {snack}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
