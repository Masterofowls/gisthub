import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Divider,
  useTheme,
  Surface,
  ActivityIndicator,
  Snackbar,
  SegmentedButtons,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../context/auth-context';
import {
  requestDeviceCode,
  pollDeviceToken,
  validatePAT,
} from '../services/auth-service';

const CLIENT_ID = process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID ?? '';

export default function AuthScreen() {
  const theme = useTheme();
  const { signIn } = useAuth();

  const [mode, setMode] = useState<'device' | 'pat'>(CLIENT_ID ? 'device' : 'pat');
  const [pat, setPat] = useState('');
  const [patLoading, setPatLoading] = useState(false);

  // Device flow state
  const [userCode, setUserCode] = useState('');
  const [verificationUri, setVerificationUri] = useState('');
  const [deviceLoading, setDeviceLoading] = useState(false);
  const [devicePending, setDevicePending] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const [snackMsg, setSnackMsg] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);

  const showSnack = (msg: string) => {
    setSnackMsg(msg);
    setSnackVisible(true);
  };

  // ── Device Flow ──────────────────────────────────────────────────────────
  const startDeviceFlow = async () => {
    setDeviceLoading(true);
    setDevicePending(false);
    try {
      const data = await requestDeviceCode();
      setUserCode(data.user_code);
      setVerificationUri(data.verification_uri);
      setDevicePending(true);
      setDeviceLoading(false);

      const ac = new AbortController();
      abortRef.current = ac;

      const token = await pollDeviceToken(data.device_code, data.interval, ac.signal);
      await signIn(token);
      router.replace('/(tabs)');
    } catch (e: unknown) {
      setDeviceLoading(false);
      setDevicePending(false);
      if (e instanceof Error && e.message !== 'Cancelled') {
        showSnack(e.message);
      }
    }
  };

  const cancelDeviceFlow = () => {
    abortRef.current?.abort();
    setDevicePending(false);
    setUserCode('');
  };

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const openGitHub = () => Linking.openURL(verificationUri || 'https://github.com/login/device');
  const copyCode = () => {
    if (userCode) {
      Clipboard.setStringAsync(userCode);
      showSnack('Code copied!');
    }
  };

  // ── PAT ──────────────────────────────────────────────────────────────────
  const signInWithPAT = async () => {
    if (!pat.trim()) return;
    setPatLoading(true);
    try {
      const ok = await validatePAT(pat.trim());
      if (!ok) throw new Error('Invalid token or missing gist scope');
      await signIn(pat.trim());
      router.replace('/(tabs)');
    } catch (e: unknown) {
      showSnack(e instanceof Error ? e.message : 'Auth failed');
    } finally {
      setPatLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <Text variant="displaySmall" style={[styles.logo, { color: theme.colors.primary }]}>
              GistHub
            </Text>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
              GitHub Gist Manager
            </Text>
          </View>

          {/* Mode selector */}
          {CLIENT_ID ? (
            <SegmentedButtons
              value={mode}
              onValueChange={(v) => setMode(v as 'device' | 'pat')}
              buttons={[
                { value: 'device', label: 'GitHub OAuth' },
                { value: 'pat', label: 'Access Token' },
              ]}
              style={styles.segmented}
            />
          ) : null}

          {/* Device flow */}
          {mode === 'device' && CLIENT_ID ? (
            <Surface style={[styles.card, { borderRadius: 16 }]} elevation={2}>
              {!devicePending ? (
                <>
                  <Text variant="titleMedium" style={styles.cardTitle}>
                    Sign in with GitHub
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}
                  >
                    We'll open GitHub in your browser. Enter the code shown here to authorize.
                  </Text>
                  <Button
                    mode="contained"
                    onPress={startDeviceFlow}
                    loading={deviceLoading}
                    disabled={deviceLoading}
                    icon="github"
                    contentStyle={styles.btnContent}
                  >
                    Continue with GitHub
                  </Button>
                </>
              ) : (
                <>
                  <Text variant="titleMedium" style={styles.cardTitle}>
                    Enter this code on GitHub
                  </Text>
                  <Surface
                    style={[
                      styles.codeBox,
                      { backgroundColor: theme.colors.primaryContainer, borderRadius: 12 },
                    ]}
                    elevation={0}
                  >
                    <Text
                      variant="headlineMedium"
                      style={{ color: theme.colors.primary, fontWeight: '700', letterSpacing: 8 }}
                    >
                      {userCode}
                    </Text>
                  </Surface>
                  <Button
                    mode="outlined"
                    icon="content-copy"
                    onPress={copyCode}
                    style={{ marginBottom: 8 }}
                  >
                    Copy Code
                  </Button>
                  <Button
                    mode="contained"
                    icon="open-in-new"
                    onPress={openGitHub}
                    style={{ marginBottom: 8 }}
                    contentStyle={styles.btnContent}
                  >
                    Open GitHub
                  </Button>
                  <View style={styles.waitingRow}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.onSurfaceVariant, marginLeft: 8 }}
                    >
                      Waiting for authorization…
                    </Text>
                  </View>
                  <Button mode="text" onPress={cancelDeviceFlow} style={{ marginTop: 4 }}>
                    Cancel
                  </Button>
                </>
              )}
            </Surface>
          ) : null}

          {/* PAT */}
          {mode === 'pat' && (
            <Surface style={[styles.card, { borderRadius: 16 }]} elevation={2}>
              <Text variant="titleMedium" style={styles.cardTitle}>
                Personal Access Token
              </Text>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}
              >
                Create a token at GitHub → Settings → Developer settings → Personal access tokens.
                Required scope: <Text style={{ fontWeight: '700' }}>gist</Text>
              </Text>
              <TextInput
                label="Token (ghp_...)"
                value={pat}
                onChangeText={setPat}
                mode="outlined"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                style={{ marginBottom: 12 }}
              />
              <Button
                mode="contained"
                onPress={signInWithPAT}
                loading={patLoading}
                disabled={!pat.trim() || patLoading}
                contentStyle={styles.btnContent}
              >
                Sign In
              </Button>
            </Surface>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={snackVisible}
        onDismiss={() => setSnackVisible(false)}
        duration={3000}
      >
        {snackMsg}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontWeight: '700',
    marginBottom: 4,
  },
  segmented: {
    marginBottom: 20,
  },
  card: {
    padding: 20,
  },
  cardTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  codeBox: {
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
  },
  btnContent: {
    height: 48,
  },
  waitingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
});
