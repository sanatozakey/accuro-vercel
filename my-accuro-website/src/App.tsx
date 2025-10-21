import { useState, useEffect } from 'react';
import { AppRouter } from './AppRouter';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import { SplashScreen } from './components/SplashScreen';
import './services/sessionTrackingService'; // Initialize session tracking

// Force fresh deployment - build timestamp
export function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [hasShownSplash, setHasShownSplash] = useState(false);

  useEffect(() => {
    // Check if splash screen has been shown in this session
    const splashShown = sessionStorage.getItem('splashScreenShown');

    if (splashShown === 'true') {
      setShowSplash(false);
      setHasShownSplash(true);
    }
  }, []);

  const handleSplashFinish = () => {
    setShowSplash(false);
    setHasShownSplash(true);
    // Mark splash as shown for this session
    sessionStorage.setItem('splashScreenShown', 'true');
  };

  return (
    <AuthProvider>
      <CartProvider>
        {showSplash && !hasShownSplash && (
          <SplashScreen onFinish={handleSplashFinish} duration={2500} />
        )}
        <AppRouter />
      </CartProvider>
    </AuthProvider>
  );
}