import React, { useState } from 'react'
import { X } from 'lucide-react'
import { useCart, CartItem } from '../../contexts/CartContext'
import { CartIcon } from './CartIcon'

export function MiniCart() {
  const { cart, getCartTotal, removeFromCart } = useCart()
  const [isOpen, setIsOpen] = useState(false)

  if (cart.length === 0) {
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white border-2 border-blue-600 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-all"
      >
        <CartIcon />
        <span className="font-medium">View Cart</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white border-2 border-gray-200 rounded-lg shadow-xl z-50">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-bold text-lg">Shopping Cart</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {cart.map((item: CartItem) => (
              <div
                key={item.id}
                className="p-4 border-b border-gray-100 flex gap-3"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 object-contain bg-gray-50 rounded"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{item.name}</h4>
                  <p className="text-xs text-gray-600">{item.category}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-700">
                      Qty: {item.quantity} × ${item.price.toLocaleString()}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-600 hover:text-red-800 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold">Total:</span>
              <span className="font-bold text-xl text-blue-600">
                ${getCartTotal().toLocaleString()}
              </span>
            </div>
            <button className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-all">
              Request Quote
            </button>
            <p className="text-xs text-gray-600 text-center mt-2">
              Final pricing will be confirmed in quote
            </p>
          </div>
        </div>
      )}
    </div>
  )
}