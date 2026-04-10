import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useAuth } from './AuthContext'

// Define cart item interface
export interface CartItem {
  id: number
  name: string
  category: string
  price: number
  quantity: number
  image: string
}

// Define cart context interface
interface CartContextType {
  cart: CartItem[]
  addToCart: (item: Omit<CartItem, 'quantity'>) => void
  removeFromCart: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  clearCart: () => void
  getCartTotal: () => number
  getCartCount: () => number
}

// Create context
const CartContext = createContext<CartContextType | undefined>(undefined)

function getCartKey(userId?: string) {
  return userId ? `cart_${userId}` : 'cart'
}

// Cart Provider Component
export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [cart, setCart] = useState<CartItem[]>(() => {
    const key = getCartKey(user?._id)
    const savedCart = localStorage.getItem(key)
    return savedCart ? JSON.parse(savedCart) : []
  })

  // Reload cart when user changes (login/logout/switch)
  useEffect(() => {
    const key = getCartKey(user?._id)
    const savedCart = localStorage.getItem(key)
    setCart(savedCart ? JSON.parse(savedCart) : [])
  }, [user?._id])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    const key = getCartKey(user?._id)
    localStorage.setItem(key, JSON.stringify(cart))
  }, [cart, user?._id])

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((i) => i.id === item.id)
      if (existingItem) {
        return prevCart.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prevCart, { ...item, quantity: 1 }]
    })
  }, [])

  const removeFromCart = useCallback((id: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id))
  }, [])

  const updateQuantity = useCallback((id: number, quantity: number) => {
    setCart((prevCart) =>
      quantity <= 0
        ? prevCart.filter((item) => item.id !== id)
        : prevCart.map((item) =>
            item.id === id ? { ...item, quantity } : item
          )
    )
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  const getCartTotal = useCallback(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }, [cart])

  const getCartCount = useCallback(() => {
    return cart.reduce((count, item) => count + item.quantity, 0)
  }, [cart])

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

// Custom hook to use cart context
export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}