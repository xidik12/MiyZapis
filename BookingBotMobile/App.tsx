import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { CurrencyProvider } from './src/contexts/CurrencyContext';
import { SocketProvider } from './src/providers/SocketProvider';
import { AppNavigator } from './src/navigation/AppNavigator';
import { store, persistor } from './src/store';
import { View, ActivityIndicator } from 'react-native';

// Inner component that uses theme hook
const AppContent: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <LanguageProvider>
        <CurrencyProvider>
          <SocketProvider>
            <AppNavigator />
          </SocketProvider>
        </CurrencyProvider>
      </LanguageProvider>
    </>
  );
};

// Loading component for PersistGate
const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" />
  </View>
);

// Main App component
export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <SafeAreaProvider>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}

