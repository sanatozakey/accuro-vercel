import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  ExternalLink,
  Calendar,
  FileText,
  Package,
  ChevronRight,
} from 'lucide-react'
import { getProductById, Product } from '../data/products'
import { useAuth } from '../contexts/AuthContext'
import { AddToCartButton } from '../components/cart/AddToCartButton'
import { MiniCart } from '../components/cart/MiniCart'
import recommendationService from '../services/recommendationService'
import productService from '../services/productService'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'

export function ProductDetail() {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const staticProduct = productId ? getProductById(productId) : undefined
  const [product, setProduct] = useState<Product | undefined>(staticProduct)
  const [loading, setLoading] = useState(!staticProduct && !!productId)

  useEffect(() => {
    if (staticProduct || !productId) return
    let cancelled = false
    setLoading(true)
    productService
      .getProduct(productId)
      .then((res) => {
        if (cancelled) return
        const p: any = res.data
        setProduct({ ...p, id: p._id })
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [productId, staticProduct])

  // Record view interaction for recommendations
  useEffect(() => {
    if (!isAuthenticated || !product) return

    recommendationService
      .recordInteraction({
        productId: product.id,
        interactionType: 'view',
        productCategory: product.category,
      })
      .catch((error) => {
        console.error('Failed to record view interaction:', error)
      })
  }, [isAuthenticated, product])

  if (loading) {
    return (
      <div className="w-full bg-background dark:bg-gray-950 min-h-screen">
        <div className="container mx-auto px-4 py-20 text-center">
          <Package className="h-20 w-20 text-gray-300 dark:text-gray-600 mx-auto mb-6 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">Loading product...</p>
        </div>
      </div>
    )
  }

  // 404 state
  if (!product) {
    return (
      <div className="w-full bg-background dark:bg-gray-950 min-h-screen">
        <div className="container mx-auto px-4 py-20 text-center">
          <Package className="h-20 w-20 text-gray-300 dark:text-gray-600 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Product Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            The product you are looking for does not exist or may have been removed.
          </p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link to="/products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-background dark:bg-gray-950">
      {/* Breadcrumb */}
      <nav className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-3">
          <ol className="flex items-center text-sm text-gray-600 dark:text-gray-400 flex-wrap gap-1">
            <li>
              <Link
                to="/"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                Home
              </Link>
            </li>
            <li>
              <ChevronRight className="h-4 w-4 mx-1 inline" />
            </li>
            <li>
              <Link
                to="/products"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                Products
              </Link>
            </li>
            <li>
              <ChevronRight className="h-4 w-4 mx-1 inline" />
            </li>
            <li className="text-gray-900 dark:text-gray-100 font-medium truncate max-w-[200px] sm:max-w-none">
              {product.name}
            </li>
          </ol>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-white dark:bg-gray-950 py-8 sm:py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Product Image */}
            <Card className="overflow-hidden dark:bg-gray-900 dark:border-gray-800">
              <CardContent className="p-6 sm:p-8">
                <div className="relative bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center p-8 min-h-[300px] sm:min-h-[400px]">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="max-h-[350px] max-w-full object-contain"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Product Details */}
            <div className="flex flex-col gap-5">
              {/* Category Badge */}
              <span className="inline-flex items-center self-start bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
                {product.category}
              </span>

              {/* Product Name */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                {product.name}
              </h1>

              {/* Price Range */}
              {product.priceRange && (
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {product.priceRange}
                  </p>
                  {product.priceRangeUSD && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {product.priceRangeUSD} (USD equivalent)
                    </p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Estimated price range. Contact us for exact pricing.
                  </p>
                </div>
              )}

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
                {product.description}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <AddToCartButton
                  product={{
                    id: product.id as any,
                    name: product.name,
                    category: product.category,
                    image: product.image,
                  }}
                  price={product.estimatedPrice || 0}
                />

                <Button
                  asChild
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Link to="/booking" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Book a Consultation
                  </Link>
                </Button>
              </div>

              {/* Beamex Link (subtle, secondary) */}
              {product.beamexUrl && (
                <a
                  href={product.beamexUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition mt-1"
                >
                  View on Beamex website
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      {product.features && product.features.length > 0 && (
        <section className="bg-gray-50 dark:bg-gray-900 py-10 sm:py-14">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
              Key Features
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {product.features.map((feature, index) => (
                <Card
                  key={index}
                  className="dark:bg-gray-800 dark:border-gray-700"
                >
                  <CardContent className="p-4 flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {feature}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Specifications Section */}
      {product.specifications && Object.keys(product.specifications).length > 0 && (
        <section className="bg-white dark:bg-gray-950 py-10 sm:py-14">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
              Specifications
            </h2>
            <Card className="overflow-hidden dark:bg-gray-900 dark:border-gray-800">
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <tbody>
                    {Object.entries(product.specifications).map(
                      ([key, value], index) => (
                        <tr
                          key={key}
                          className={
                            index % 2 === 0
                              ? 'bg-gray-50 dark:bg-gray-800/50'
                              : 'bg-white dark:bg-gray-900'
                          }
                        >
                          <td className="px-6 py-3 font-medium text-gray-900 dark:text-gray-100 w-1/3 border-b border-gray-100 dark:border-gray-800">
                            {key}
                          </td>
                          <td className="px-6 py-3 text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                            {String(value)}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Bottom CTA Section */}
      <section className="bg-gradient-to-br from-navy-900 via-navy-900 to-blue-900 dark:from-gray-900 dark:via-gray-900 dark:to-blue-900 text-white py-12 sm:py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
            Need help deciding?
          </h2>
          <p className="text-base sm:text-lg text-gray-200 mb-8 max-w-xl mx-auto">
            Our calibration experts are ready to help you find the right
            solution for your needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              <Link to="/request-quote" className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Request Quotation
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              <Link to="/booking" className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Book a Consultation
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600"
            >
              <Link to="/contact" className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5" />
                Contact Us
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Back to Products */}
      <section className="bg-gray-50 dark:bg-gray-900 py-6">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/products')}
            className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to All Products
          </Button>
        </div>
      </section>

      {/* Mini Cart */}
      <MiniCart />
    </div>
  )
}
