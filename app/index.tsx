import { Redirect } from 'expo-router';
import { useAuth } from '../context/auth-context';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from 'react-native-paper';

export default function Index() {
  const { token, isLoading } = useAuth();
  const theme = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return <Redirect href={token ? '/(tabs)' : '/auth'} />;
}
