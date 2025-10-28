import React, { useState, useEffect, useRef } from 'react'
import { ExternalLink, Search, Filter, X } from 'lucide-react'
import { productCategories, getProductsByCategory, Product } from '../data/products'
import { LazyImage } from '../components/LazyImage'
import { AddToCartButton } from '../components/cart/AddToCartButton'
import { MiniCart } from '../components/cart/MiniCart'
import { ProductRecommendations } from '../components/ProductRecommendations'
import { useAuth } from '../contexts/AuthContext'
import recommendationService from '../services/recommendationService'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'

export function Products() {
  const [selectedCategory, setSelectedCategory] = useState('All Products')
  const [searchQuery, setSearchQuery] = useState('')
  const [currency, setCurrency] = useState<'PHP' | 'USD'>('PHP')
  const [showDiscontinued, setShowDiscontinued] = useState(false)

  // Filter products based on category, search query, and discontinued status
  const filteredProducts = getProductsByCategory(selectedCategory).filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())

    const isDiscontinued = product.description.toLowerCase().includes('discontinued')
    const matchesDiscontinuedFilter = showDiscontinued || !isDiscontinued

    return matchesSearch && matchesDiscontinuedFilter
  })

  return (
    <div className="w-full bg-background dark:bg-gray-950">
      {/* Mini Cart */}
      <MiniCart />

      {/* Products Header */}
      <section className="bg-navy-900 dark:bg-gray-900 text-white py-12 sm:py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-900 to-blue-900 dark:from-gray-900 dark:via-gray-900 dark:to-blue-900 opacity-90" />
        <div className="container mx-auto px-4 relative z-10">
          <Badge className="mb-4 bg-blue-600 hover:bg-blue-700 text-white border-0">
            Products Catalog
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-3">Beamex Products</h1>
          <p className="text-base sm:text-lg max-w-2xl text-gray-200">
            Complete range of calibration solutions for all your calibration needs.
          </p>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-4 sm:py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-4">
            {/* Search Bar - Full width on mobile */}
            <div className="w-full relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <Input
                type="text"
                placeholder="Search products by name, category, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-6 text-sm dark:bg-gray-800 dark:border-gray-700"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Filters Row - Stack on mobile, inline on tablet+ */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              {/* Category Filter */}
              <div className="flex items-center gap-2 flex-1">
                <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full sm:w-auto flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {productCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Show Discontinued Toggle */}
              <label className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                <input
                  type="checkbox"
                  checked={showDiscontinued}
                  onChange={(e) => setShowDiscontinued(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">Show Discontinued</span>
              </label>

              {/* Currency Toggle */}
              <div className="flex bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md overflow-hidden">
                <Button
                  variant={currency === 'PHP' ? 'default' : 'ghost'}
                  onClick={() => setCurrency('PHP')}
                  className={`flex-1 sm:flex-none rounded-none ${
                    currency === 'PHP'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  PHP (₱)
                </Button>
                <Button
                  variant={currency === 'USD' ? 'default' : 'ghost'}
                  onClick={() => setCurrency('USD')}
                  className={`flex-1 sm:flex-none rounded-none ${
                    currency === 'USD'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  USD ($)
                </Button>
              </div>
            </div>
          </div>

          {/* Results Count & Active Filters */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="dark:bg-gray-800 dark:text-gray-300">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
            </Badge>
            {selectedCategory !== 'All Products' && (
              <Badge variant="outline" className="dark:border-gray-700 dark:text-gray-300">
                {selectedCategory}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategory('All Products')}
                  className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="outline" className="dark:border-gray-700 dark:text-gray-300">
                Search: "{searchQuery}"
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {showDiscontinued && (
              <Badge variant="outline" className="dark:border-gray-700 dark:text-gray-300">
                Including Discontinued
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDiscontinued(false)}
                  className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-8 sm:py-12 dark:bg-gray-950">
        <div className="container mx-auto px-4">
          {/* Product Recommendations */}
          <ProductRecommendations
            limit={5}
            title="Recommended Products"
            subtitle="Personalized suggestions based on your interests"
          />

          {filteredProducts.length === 0 ? (
            <Card className="text-center py-12 dark:bg-gray-900 dark:border-gray-800">
              <CardContent className="pt-6">
                <Search className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <CardTitle className="text-2xl md:text-3xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No products found
                </CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Try adjusting your search or filter criteria
                </p>
                <Button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory('All Products')
                    setShowDiscontinued(false)
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} currency={currency} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-blue-600 dark:bg-blue-700 text-white py-12 sm:py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Need Help Choosing?</h2>
          <p className="text-base sm:text-lg mb-6 max-w-xl mx-auto text-blue-50">
            Our calibration experts are here to help you select the perfect solution.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              variant="secondary"
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              <a href="/contact">Contact Us</a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600"
            >
              <a href="/booking">Schedule Consultation</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

// Product Card Component
function ProductCard({ product, currency }: { product: Product; currency: 'PHP' | 'USD' }) {
  const { isAuthenticated } = useAuth();
  const [hasRecordedView, setHasRecordedView] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Record view interaction when product card comes into view
  useEffect(() => {
    if (!isAuthenticated || hasRecordedView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasRecordedView) {
            // Record view interaction
            recommendationService
              .recordInteraction({
                productId: String(product.id),
                interactionType: 'view',
                productCategory: product.category,
              })
              .then(() => {
                setHasRecordedView(true);
              })
              .catch((error) => {
                console.error('Failed to record view interaction:', error);
              });
          }
        });
      },
      {
        threshold: 0.5, // Trigger when 50% of the card is visible
        rootMargin: '0px',
      }
    );

    const currentCard = cardRef.current;
    if (currentCard) {
      observer.observe(currentCard);
    }

    return () => {
      if (currentCard) {
        observer.unobserve(currentCard);
      }
    };
  }, [isAuthenticated, hasRecordedView, product.id, product.category]);

  return (
    <Card
      ref={cardRef}
      className="group overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col dark:bg-gray-900 dark:border-gray-800">
      {/* Product Image */}
      <div className="relative h-48 bg-gray-50 dark:bg-gray-800 flex items-center justify-center p-4">
        <LazyImage
          src={product.image}
          alt={product.name}
          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
        />
        <Badge className="absolute top-3 right-3 bg-blue-600 hover:bg-blue-700 text-white border-0 text-[10px]">
          {product.category}
        </Badge>
      </div>

      {/* Product Details */}
      <CardContent className="p-5 flex-1 flex flex-col">
        <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
          {product.name}
        </h3>

        {/* Price */}
        {((currency === 'PHP' && product.priceRange) || (currency === 'USD' && product.priceRangeUSD)) && (
          <div className="mb-3">
            <p className="text-blue-600 dark:text-blue-400 font-bold text-base">
              {currency === 'PHP' ? product.priceRange : product.priceRangeUSD}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Est. price range</p>
          </div>
        )}

        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 flex-1 line-clamp-3">
          {product.description}
        </p>

        {/* Features List */}
        {product.features && product.features.length > 0 && (
          <div className="mb-4">
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              {product.features.slice(0, 3).map((feature, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">✓</span>
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
            <Button
              variant="outline"
              size="sm"
              asChild
              className="w-full dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <a
                href={product.beamexUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                View Details
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
