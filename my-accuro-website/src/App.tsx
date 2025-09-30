import { AppRouter } from './AppRouter';
import { CartProvider } from './contexts/CartContext';

export function App() {
  return (
    <CartProvider>
      <AppRouter />
    </CartProvider>
  );
}