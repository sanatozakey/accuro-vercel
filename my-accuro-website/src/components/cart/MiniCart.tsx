import React, { useState, useEffect } from 'react'
import { X, Send } from 'lucide-react'
import { useCart, CartItem } from '../../contexts/CartContext'
import { CartIcon } from './CartIcon'
import { useNavigate } from 'react-router-dom'
import { ConfirmModal } from '../ConfirmModal'

interface MiniCartProps {
  darkMode?: boolean
}

export function MiniCart({ darkMode: propDarkMode }: MiniCartProps) {
  const { cart, getCartTotal, removeFromCart, clearCart } = useCart()
  const [isOpen, setIsOpen] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const navigate = useNavigate()

  // Use prop or detect from localStorage/system preference
  const [darkMode, setDarkMode] = useState(propDarkMode ?? false)

  useEffect(() => {
    if (propDarkMode !== undefined) {
      setDarkMode(propDarkMode)
    } else {
      // Check localStorage for dark mode preference
      const stored = localStorage.getItem('darkMode')
      if (stored !== null) {
        setDarkMode(stored === 'true')
      } else {
        // Fallback to system preference
        setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches)
      }
    }
  }, [propDarkMode])

  const handleRequestQuote = () => {
    // Store cart data in localStorage for the booking page
    localStorage.setItem('quoteCart', JSON.stringify(cart))
    localStorage.setItem('cartTotal', getCartTotal().toString())
    // Navigate to booking page
    navigate('/booking?type=quote')
    setIsOpen(false)
  }

  const handleClearCart = () => {
    clearCart()
    setIsOpen(false)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(price)
  }

  if (cart.length === 0) {
    return null
  }

  return (
    <>
      {/* Floating Cart Button */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-105"
        >
          <CartIcon />
          <span className="font-medium text-sm">Cart ({cart.length})</span>
        </button>
      </div>

      {/* Cart Drawer/Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Cart Panel */}
          <div className={`fixed right-0 top-0 h-full w-full sm:max-w-md shadow-2xl z-50 flex flex-col animate-slide-in ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-blue-600 text-white">
              <div>
                <h3 className="font-bold text-lg">Your Quote Cart</h3>
                <p className="text-xs text-blue-100">{cart.length} item{cart.length !== 1 ? 's' : ''} selected</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto">
              {cart.map((item: CartItem) => (
                <div
                  key={item.id}
                  className={`p-4 border-b transition ${
                    darkMode
                      ? 'border-gray-700 hover:bg-gray-700/50'
                      : 'border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className={`w-20 h-20 object-contain border rounded p-1 ${
                        darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                      }`}
                    />
                    <div className="flex-1">
                      <h4 className={`font-medium text-sm mb-1 ${
                        darkMode ? 'text-gray-200' : 'text-gray-900'
                      }`}>{item.name}</h4>
                      <p className={`text-xs mb-2 ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>{item.category}</p>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className={`text-xs ${
                            darkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>Qty: {item.quantity}</p>
                          <p className="text-sm font-semibold text-blue-500">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className={`text-red-500 hover:text-red-600 text-xs font-medium px-2 py-1 rounded transition ${
                            darkMode ? 'hover:bg-red-900/30' : 'hover:bg-red-50'
                          }`}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Informational Note */}
              <div className={`p-4 m-4 border rounded-lg ${
                darkMode
                  ? 'bg-blue-900/30 border-blue-700'
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <p className={`text-xs ${
                  darkMode ? 'text-blue-200' : 'text-blue-800'
                }`}>
                  <strong>Note:</strong> Prices shown are estimated. Final pricing will be confirmed in your personalized quote.
                </p>
              </div>
            </div>

            {/* Footer / Totals */}
            <div className={`border-t p-4 ${
              darkMode
                ? 'border-gray-700 bg-gray-900/50'
                : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-sm ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Subtotal:</span>
                  <span className={`text-lg font-bold ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {formatPrice(getCartTotal())}
                  </span>
                </div>
                <p className={`text-xs ${
                  darkMode ? 'text-gray-500' : 'text-gray-500'
                }`}>Estimated total (excluding taxes & shipping)</p>
              </div>

              <button
                onClick={handleRequestQuote}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-all flex items-center justify-center gap-2 mb-2"
              >
                <Send size={18} />
                Request Official Quote
              </button>

              <button
                onClick={() => setShowClearConfirm(true)}
                className={`w-full border py-2 rounded-lg font-medium transition-all text-sm ${
                  darkMode
                    ? 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Clear Cart
              </button>
            </div>
          </div>
        </>
      )}

      {/* Clear Cart Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearCart}
        title="Clear Cart?"
        message={`Are you sure you want to remove all ${cart.length} item${cart.length !== 1 ? 's' : ''} from your cart? This action cannot be undone.`}
        confirmText="Clear Cart"
        cancelText="Keep Items"
        confirmStyle="danger"
        darkMode={darkMode}
      />
    </>
  )
}
