import React from 'react';
import { Provider as PaperProvider, Portal } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/constants/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <Portal.Host>
          <AuthProvider>
            <AppNavigator />
          </AuthProvider>
        </Portal.Host>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
