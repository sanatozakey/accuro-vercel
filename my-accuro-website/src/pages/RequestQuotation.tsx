import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FileText,
  Plus,
  Trash2,
  Search,
  ChevronDown,
  CheckCircle,
  Package,
  Send,
  ArrowLeft,
  X,
  ShoppingCart,
  Info,
  Clock,
  Shield,
  Calendar,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { products as staticProducts, Product as StaticProduct } from '../data/products'
import quotationService, { CreateQuotationData, QuotationItem } from '../services/quotationService'
import { useCart } from '../contexts/CartContext'
import { QuotationReceiptModal } from '../components/QuotationReceiptModal'

interface SelectedItem {
  productId: string
  productName: string
  productImage?: string
  category: string
  quantity: number
  specifications: string
}

export function RequestQuotation() {
  const { user } = useAuth()
  const { clearCart } = useCart()
  const navigate = useNavigate()

  // Products (from static data, same source as Products page)
  const [products] = useState<StaticProduct[]>(staticProducts)
  const [loadingProducts] = useState(false)

  // Selected items
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])

  // Product search
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Form fields
  const [company, setCompany] = useState(user?.company || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [additionalRequirements, setAdditionalRequirements] = useState('')

  // Submission state
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [quotationNumber, setQuotationNumber] = useState('')
  const [submittedSnapshot, setSubmittedSnapshot] = useState<{
    items: SelectedItem[]
    company: string
    phone: string
    additionalRequirements: string
    submittedAt: string
  } | null>(null)
  const [showReceipt, setShowReceipt] = useState(false)

  // Pre-populate from quote list (MiniCart) if available
  useEffect(() => {
    const quoteCartRaw = localStorage.getItem('quoteCart')
    if (quoteCartRaw) {
      try {
        const quoteCart = JSON.parse(quoteCartRaw) as Array<{
          id: number | string
          name: string
          category: string
          price: number
          quantity: number
          image: string
        }>
        if (quoteCart.length > 0) {
          const preItems: SelectedItem[] = quoteCart.map((cartItem) => {
            // Match to static product by name or id
            const matched = staticProducts.find(
              (p) => p.name === cartItem.name || p.id === String(cartItem.id)
            )
            return {
              productId: matched?.id || String(cartItem.id),
              productName: cartItem.name,
              productImage: cartItem.image || matched?.image,
              category: cartItem.category,
              quantity: cartItem.quantity,
              specifications: '',
            }
          })
          setSelectedItems(preItems)
        }
      } catch {
        // ignore parse errors
      }
      localStorage.removeItem('quoteCart')
      localStorage.removeItem('cartTotal')
    }
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Filter products by search (exclude already selected, exclude discontinued)
  const filteredProducts = products.filter(
    (p) =>
      !selectedItems.find((item) => item.productId === p.id) &&
      !p.description.toLowerCase().includes('discontinued') &&
      (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Add product to selection
  const addProduct = (product: StaticProduct) => {
    setSelectedItems((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        category: product.category,
        quantity: 1,
        specifications: '',
      },
    ])
    setSearchQuery('')
    setShowDropdown(false)
  }

  // Remove product from selection
  const removeProduct = (productId: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.productId !== productId))
  }

  // Update item quantity
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return
    setSelectedItems((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, quantity } : item))
    )
  }

  // Update item specifications
  const updateSpecifications = (productId: string, specifications: string) => {
    setSelectedItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, specifications } : item
      )
    )
  }

  // Submit quotation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedItems.length === 0) {
      toast.error('Please add at least one product')
      return
    }

    if (!company.trim()) {
      toast.error('Company name is required')
      return
    }

    if (!phone.trim()) {
      toast.error('Phone number is required')
      return
    }

    setSubmitting(true)
    try {
      const items: QuotationItem[] = selectedItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        quantity: item.quantity,
        specifications: item.specifications || undefined,
      }))

      const data: CreateQuotationData = {
        customerName: user?.name || '',
        customerEmail: user?.email || '',
        customerPhone: phone,
        company: company,
        items,
        additionalRequirements: additionalRequirements || undefined,
      }

      const response = await quotationService.createQuotation(data)
      if (response.success) {
        setSubmittedSnapshot({
          items: [...selectedItems],
          company,
          phone,
          additionalRequirements,
          submittedAt: response.data?.createdAt || new Date().toISOString(),
        })
        clearCart() // Clear the quote list after successful submission
        setSubmitted(true)
        setQuotationNumber(response.data?.quotationNumber || '')
        toast.success('Quotation request submitted successfully!')
      } else {
        toast.error(response.message || 'Failed to submit quotation')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit quotation request')
    } finally {
      setSubmitting(false)
    }
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Quotation Request Submitted!
            </h1>
            {quotationNumber && (
              <p className="text-lg text-blue-600 dark:text-blue-400 font-semibold mb-2">
                Reference: {quotationNumber}
              </p>
            )}
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Our team will review your request and prepare a detailed quotation. You'll receive
              a notification once it's ready.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4 flex-wrap">
              <Link
                to="/quotations"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
              >
                <FileText className="h-5 w-5 mr-2" />
                View My Quotations
              </Link>
              <button
                onClick={() => {
                  setSubmitted(false)
                  setSelectedItems([])
                  setAdditionalRequirements('')
                  setQuotationNumber('')
                  setSubmittedSnapshot(null)
                }}
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <Plus className="h-5 w-5 mr-2" />
                Submit Another Request
              </button>
            </div>
            {submittedSnapshot && quotationNumber && (
              <div className="flex justify-center mb-8">
                <button
                  onClick={() => setShowReceipt(true)}
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 underline underline-offset-2"
                >
                  <FileText className="h-4 w-4" />
                  View / Download Receipt
                </button>
              </div>
            )}

            {/* What's Next */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">What's Next?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                <Link
                  to="/products"
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition group"
                >
                  <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm text-gray-900 dark:text-white">Continue Browsing</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Explore more products</p>
                  </div>
                </Link>
                <Link
                  to="/booking"
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition group"
                >
                  <div className="h-9 w-9 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm text-gray-900 dark:text-white">Book a Consultation</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Discuss your needs</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
        {showReceipt && submittedSnapshot && quotationNumber && (
          <QuotationReceiptModal
            onClose={() => setShowReceipt(false)}
            quotation={{
              quotationNumber,
              customerName: user?.name || '',
              customerEmail: user?.email || '',
              customerPhone: submittedSnapshot.phone,
              company: submittedSnapshot.company,
              items: submittedSnapshot.items.map((i) => ({
                productName: i.productName,
                quantity: i.quantity,
                specifications: i.specifications,
              })),
              additionalRequirements: submittedSnapshot.additionalRequirements,
              submittedAt: submittedSnapshot.submittedAt,
            }}
          />
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 sm:py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-4 transition"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </button>
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Request a Quotation
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Select products, specify quantities, and we'll prepare a detailed quotation for you.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Selection */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5 text-emerald-600" />
                  Select Products
                </h2>

                {/* Product Search */}
                <div className="relative" ref={dropdownRef}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products by name or category..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setShowDropdown(true)
                      }}
                      onFocus={() => setShowDropdown(true)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                    />
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>

                  {/* Dropdown */}
                  {showDropdown && (
                    <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {loadingProducts ? (
                        <div className="p-4 text-center text-gray-500">Loading products...</div>
                      ) : filteredProducts.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          {searchQuery ? 'No matching products found' : 'All products already added'}
                        </div>
                      ) : (
                        filteredProducts.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => addProduct(product)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 dark:hover:bg-gray-600 transition text-left border-b border-gray-100 dark:border-gray-600 last:border-0"
                          >
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                                <Package className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {product.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {product.category}
                                {product.priceRange && ` · ${product.priceRange}`}
                              </p>
                            </div>
                            <Plus className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Items */}
                {selectedItems.length === 0 ? (
                  <div className="mt-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                    <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                      No products selected yet
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      Search and select products above to add them to your quotation request
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 space-y-4">
                    {selectedItems.map((item, index) => (
                      <div
                        key={item.productId}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:border-emerald-300 dark:hover:border-emerald-600 transition"
                      >
                        <div className="flex items-start gap-4">
                          {/* Product Image */}
                          {item.productImage ? (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                              <Package className="h-8 w-8 text-gray-400" />
                            </div>
                          )}

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {item.productName}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {item.category}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeProduct(item.productId)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition flex-shrink-0"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>

                            {/* Quantity */}
                            <div className="mt-3 flex items-center gap-4">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Qty:
                              </label>
                              <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                  className="px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-lg transition"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    updateQuantity(item.productId, parseInt(e.target.value) || 1)
                                  }
                                  className="w-16 text-center py-1.5 border-x border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                />
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                  className="px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-lg transition"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Specifications */}
                            <div className="mt-3">
                              <textarea
                                placeholder="Any specific requirements or specifications for this product..."
                                value={item.specifications}
                                onChange={(e) =>
                                  updateSpecifications(item.productId, e.target.value)
                                }
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition resize-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Additional Requirements */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  Additional Requirements
                </h2>
                <textarea
                  placeholder="Any additional details, delivery requirements, timeline preferences, or special instructions..."
                  value={additionalRequirements}
                  onChange={(e) => setAdditionalRequirements(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition resize-none"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {additionalRequirements.length}/2000
                </p>
              </div>
            </div>

            {/* Sidebar - Right Column */}
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Your Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={user?.name || ''}
                      disabled
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Company <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Your company name"
                      required
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +63 917 123 4567"
                      required
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Request Summary
                </h2>
                {selectedItems.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No products selected yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedItems.map((item) => (
                      <div
                        key={item.productId}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-700 dark:text-gray-300 truncate mr-2">
                          {item.productName}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">
                          x{item.quantity}
                        </span>
                      </div>
                    ))}
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
                      <div className="flex items-center justify-between text-sm font-semibold">
                        <span className="text-gray-900 dark:text-white">Total Items</span>
                        <span className="text-gray-900 dark:text-white">
                          {selectedItems.reduce((sum, item) => sum + item.quantity, 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || selectedItems.length === 0}
                  className="w-full mt-6 inline-flex items-center justify-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition shadow-sm"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Submit Quotation Request
                    </>
                  )}
                </button>
              </div>

              {/* Info Card */}
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 p-6">
                <h3 className="font-semibold text-emerald-900 dark:text-emerald-300 mb-3">
                  How It Works
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      1
                    </div>
                    <p className="text-sm text-emerald-800 dark:text-emerald-300">
                      Select products and specify quantities and requirements
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      2
                    </div>
                    <p className="text-sm text-emerald-800 dark:text-emerald-300">
                      Our team reviews your request and prepares a detailed quote
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      3
                    </div>
                    <p className="text-sm text-emerald-800 dark:text-emerald-300">
                      You'll receive a notification with pricing and terms
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
                  <Clock className="h-4 w-4" />
                  Typical response time: 1-2 business days
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RequestQuotation
