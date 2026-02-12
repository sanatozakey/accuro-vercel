/**
 * Accuro Mobile App
 * React Native application for Accuro Calibration Solutions
 */

import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { AuthProvider } from './src/contexts/AuthContext';
import { CartProvider } from './src/contexts/CartContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { lightTheme, darkTheme } from './src/theme/theme';
import SplashScreen from './src/components/common/SplashScreen';

function AppContent() {
  const { isDark } = useTheme();
  const theme = isDark ? darkTheme : lightTheme;
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} duration={2500} />;
  }

  return (
    <PaperProvider theme={theme}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <AuthProvider>
        <CartProvider>
          <AppNavigator />
          <Toast />
        </CartProvider>
      </AuthProvider>
    </PaperProvider>
  );
}

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
