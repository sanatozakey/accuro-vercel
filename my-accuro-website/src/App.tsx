import { useState } from 'react';
import { AppRouter } from './AppRouter';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SplashScreen } from './components/SplashScreen';
import './services/sessionTrackingService'; // Initialize session tracking

// Force fresh deployment - build timestamp
export function App() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          {showSplash && (
            <SplashScreen onFinish={handleSplashFinish} duration={2500} />
          )}
          <AppRouter showSplash={showSplash} />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}