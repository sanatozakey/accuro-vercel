import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
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
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}