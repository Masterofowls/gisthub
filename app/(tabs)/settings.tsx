import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Appbar,
  List,
  Switch,
  Divider,
  useTheme,
  Text,
  Avatar,
  Surface,
  Button,
  Portal,
  Dialog,
  Snackbar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/auth-context';
import { cacheService } from '../../services/cache-service';

export default function SettingsScreen() {
  const theme = useTheme();
  const { user, signOut } = useAuth();
  const scheme = useColorScheme();

  const [signOutDialog, setSignOutDialog] = useState(false);
  const [clearCacheDialog, setClearCacheDialog] = useState(false);
  const [snack, setSnack] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);

  const showSnack = (msg: string) => {
    setSnack(msg);
    setSnackVisible(true);
  };

  const handleSignOut = async () => {
    setSignOutDialog(false);
    await signOut();
    router.replace('/auth');
  };

  const handleClearCache = async () => {
    setClearCacheDialog(false);
    await cacheService.clearAll();
    showSnack('Cache cleared');
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.Content title="Settings" titleStyle={{ fontWeight: '700' }} />
      </Appbar.Header>

      <ScrollView>
        {/* Profile */}
        {user && (
          <Surface style={[styles.profileCard, { borderRadius: 16 }]} elevation={1}>
            <Avatar.Image size={56} source={{ uri: user.avatar_url }} />
            <View style={styles.profileInfo}>
              <Text variant="titleMedium" style={{ fontWeight: '700' }}>
                {user.name || user.login}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                @{user.login}
              </Text>
              {user.bio ? (
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}
                  numberOfLines={2}
                >
                  {user.bio}
                </Text>
              ) : null}
            </View>
          </Surface>
        )}

        {/* Stats */}
        {user && (
          <Surface style={[styles.statsRow, { borderRadius: 12 }]} elevation={0}>
            <View style={styles.stat}>
              <Text variant="headlineSmall" style={{ fontWeight: '700', color: theme.colors.primary }}>
                {user.public_gists}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Public Gists
              </Text>
            </View>
            <Divider style={{ height: '100%', width: 1 }} />
            <View style={styles.stat}>
              <Text variant="headlineSmall" style={{ fontWeight: '700', color: theme.colors.primary }}>
                {user.followers}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Followers
              </Text>
            </View>
            <Divider style={{ height: '100%', width: 1 }} />
            <View style={styles.stat}>
              <Text variant="headlineSmall" style={{ fontWeight: '700', color: theme.colors.primary }}>
                {user.following}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Following
              </Text>
            </View>
          </Surface>
        )}

        <List.Section title="Appearance">
          <List.Item
            title="Theme"
            description={scheme === 'dark' ? 'Dark (system)' : 'Light (system)'}
            left={(p) => <List.Icon {...p} icon="theme-light-dark" />}
          />
        </List.Section>

        <Divider />

        <List.Section title="Data">
          <List.Item
            title="Clear Cache"
            description="Remove locally cached gist data"
            left={(p) => <List.Icon {...p} icon="delete-sweep-outline" />}
            onPress={() => setClearCacheDialog(true)}
          />
        </List.Section>

        <Divider />

        <List.Section title="Account">
          <List.Item
            title="Sign Out"
            description={user ? `Signed in as @${user.login}` : ''}
            left={(p) => <List.Icon {...p} icon="logout" color={theme.colors.error} />}
            onPress={() => setSignOutDialog(true)}
            titleStyle={{ color: theme.colors.error }}
          />
        </List.Section>

        <View style={styles.footer}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            GistHub v1.0.0
          </Text>
        </View>
      </ScrollView>

      <Portal>
        <Dialog visible={signOutDialog} onDismiss={() => setSignOutDialog(false)}>
          <Dialog.Title>Sign out?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">You'll need to sign in again to access your gists.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSignOutDialog(false)}>Cancel</Button>
            <Button textColor={theme.colors.error} onPress={handleSignOut}>
              Sign Out
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={clearCacheDialog} onDismiss={() => setClearCacheDialog(false)}>
          <Dialog.Title>Clear cache?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">This will remove all locally cached gist data.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setClearCacheDialog(false)}>Cancel</Button>
            <Button onPress={handleClearCache}>Clear</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={snackVisible} onDismiss={() => setSnackVisible(false)} duration={2000}>
        {snack}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 16,
    gap: 16,
  },
  profileInfo: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  footer: {
    alignItems: 'center',
    padding: 24,
  },
});
