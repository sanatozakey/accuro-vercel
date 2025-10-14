import React, { useState } from 'react'
import { ShoppingCart, Check } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'
import recommendationService from '../../services/recommendationService'

interface AddToCartButtonProps {
  product: {
    id: number
    name: string
    category: string
    image: string
  }
  price: number
  disabled?: boolean
}

export function AddToCartButton({ product, price, disabled = false }: AddToCartButtonProps) {
  const { addToCart } = useCart()
  const { isAuthenticated } = useAuth()
  const [showAdded, setShowAdded] = useState(false)

  const handleAddToCart = () => {
    if (disabled) return

    addToCart({
      id: product.id,
      name: product.name,
      category: product.category,
      price: price,
      image: product.image,
    })

    // Record purchase interaction if user is authenticated
    if (isAuthenticated) {
      recommendationService
        .recordInteraction({
          productId: product.id.toString(),
          interactionType: 'purchase',
          productCategory: product.category,
        })
        .catch((error) => {
          console.error('Failed to record purchase interaction:', error);
        });
    }

    setShowAdded(true)
    setTimeout(() => setShowAdded(false), 2000)
  }

  return (
    <div className="relative">
      <button
        onClick={handleAddToCart}
        disabled={disabled}
        className={`px-4 py-2 rounded font-medium text-sm transition-all ${
          disabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : showAdded
            ? 'bg-green-600 text-white'
            : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
        }`}
      >
        {showAdded ? (
          <span className="flex items-center gap-2">
            <Check size={16} />
            Added!
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <ShoppingCart size={16} />
            Add to Cart
          </span>
        )}
      </button>
      
      {showAdded && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-3 py-1 rounded shadow-lg animate-bounce">
          Added to cart!
        </div>
      )}
    </div>
  )
}