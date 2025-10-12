import React, { useState } from 'react'
import { ExternalLink, Search, Filter, ShoppingCart } from 'lucide-react'
import { products, productCategories, getProductsByCategory, Product } from '../data/products'
import { LazyImage } from '../components/LazyImage'
import { AddToCartButton } from '../components/cart/AddToCartButton'
import { MiniCart } from '../components/cart/MiniCart'

export function Products() {
  const [selectedCategory, setSelectedCategory] = useState('All Products')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currency, setCurrency] = useState<'PHP' | 'USD'>('PHP')

  // Filter products based on category and search query
  const filteredProducts = getProductsByCategory(selectedCategory).filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="w-full bg-white">
      {/* Mini Cart */}
      <MiniCart />

      {/* Products Header */}
      <section className="bg-navy-900 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Beamex Products</h1>
          <p className="text-base max-w-2xl">
            Complete range of calibration solutions for all your calibration needs.
          </p>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="bg-gray-50 border-b border-gray-200 py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-3">
            {/* Search Bar - Full width on mobile */}
            <div className="w-full relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filters Row - Stack on mobile, inline on tablet+ */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              {/* Category Filter */}
              <div className="flex items-center gap-2 flex-1">
                <Filter className="h-4 w-4 text-gray-600 flex-shrink-0" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full sm:w-auto flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {productCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Currency Toggle */}
              <div className="flex bg-white border border-gray-300 rounded-md overflow-hidden">
                <button
                  onClick={() => setCurrency('PHP')}
                  className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium transition ${
                    currency === 'PHP'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  PHP (₱)
                </button>
                <button
                  onClick={() => setCurrency('USD')}
                  className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium transition ${
                    currency === 'USD'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  USD ($)
                </button>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-3 text-xs text-gray-600">
            <span className="font-medium">{filteredProducts.length}</span> product{filteredProducts.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No products found</h3>
              <p className="text-sm text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('All Products')
                }}
                className="px-5 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} currency={currency} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-blue-600 text-white py-10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-3">Need Help Choosing?</h2>
          <p className="text-sm mb-5 max-w-xl mx-auto">
            Our calibration experts are here to help you select the perfect solution.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/contact"
              className="inline-block bg-white text-blue-600 px-6 py-2.5 rounded-md font-medium text-sm hover:bg-gray-100 transition"
            >
              Contact Us
            </a>
            <a
              href="/booking"
              className="inline-block bg-blue-700 text-white px-6 py-2.5 rounded-md font-medium text-sm hover:bg-blue-800 transition border border-white"
            >
              Schedule Consultation
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

// Product Card Component
function ProductCard({ product, currency }: { product: Product; currency: 'PHP' | 'USD' }) {
  const formatPrice = (price: number, curr: 'PHP' | 'USD') => {
    return new Intl.NumberFormat(curr === 'PHP' ? 'en-PH' : 'en-US', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 flex flex-col">
      {/* Product Image */}
      <div className="relative h-44 bg-gray-50 flex items-center justify-center p-3">
        <LazyImage
          src={product.image}
          alt={product.name}
          className="max-h-full max-w-full object-contain"
        />
        <span className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded">
          {product.category}
        </span>
      </div>

      {/* Product Details */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-base mb-1.5 text-gray-900 line-clamp-2">{product.name}</h3>

        {/* Price */}
        {((currency === 'PHP' && product.priceRange) || (currency === 'USD' && product.priceRangeUSD)) && (
          <div className="mb-2">
            <p className="text-blue-600 font-bold text-sm">
              {currency === 'PHP' ? product.priceRange : product.priceRangeUSD}
            </p>
            <p className="text-[11px] text-gray-500">Est. price range</p>
          </div>
        )}

        <p className="text-gray-600 text-xs mb-3 flex-1 line-clamp-2">{product.description}</p>

        {/* Features List */}
        {product.features && product.features.length > 0 && (
          <div className="mb-3">
            <ul className="text-[11px] text-gray-500 space-y-0.5">
              {product.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-600 mr-1">•</span>
                  <span className="line-clamp-1">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 mt-auto">
          {product.estimatedPrice && (
            <AddToCartButton
              product={{
                id: product.id,
                name: product.name,
                category: product.category,
                image: product.image,
              }}
              price={product.estimatedPrice}
            />
          )}

          {product.beamexUrl && (
            <a
              href={product.beamexUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-center py-1.5 rounded text-[11px] font-medium transition flex items-center justify-center gap-1"
            >
              Details
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
