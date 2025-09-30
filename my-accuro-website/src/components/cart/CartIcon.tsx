import React from 'react'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'

export function CartIcon() {
  const { getCartCount } = useCart()
  const count = getCartCount()

  return (
    <div className="relative inline-block">
      <ShoppingCart size={24} className="text-gray-700" />
      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
          {count}
        </span>
      )}
    </div>
  )
}