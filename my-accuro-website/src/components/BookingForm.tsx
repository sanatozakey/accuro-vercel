import React, { useState, useEffect } from 'react'
import {
  Calendar,
  Clock,
  MapPin,
  Building,
  FileText,
  Package,
  Download,
  LogIn,
} from 'lucide-react'
import bookingService from '../services/bookingService'
import { TimeSlotPicker } from './TimeSlotPicker'
import { useLocation } from 'react-router-dom'
import { CartItem } from '../contexts/CartContext'
import { generateBookingReceipt } from '../utils/pdfGenerator'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'

interface BookingFormProps {
  onSubmit: (success: boolean, error?: string, bookingData?: any) => void
}
export function BookingForm({ onSubmit }: BookingFormProps) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    company: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    purpose: '',
    location: '',
    product: '',
    additionalInfo: '',
  })
  const [loading, setLoading] = useState(false)

  // Check if coming from cart quote request
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('type') === 'quote') {
      const quoteCart = localStorage.getItem('quoteCart')
      const cartTotal = localStorage.getItem('cartTotal')

      if (quoteCart) {
        try {
          const cart: CartItem[] = JSON.parse(quoteCart)
          const total = cartTotal ? parseFloat(cartTotal) : 0

          // Format cart items into a readable summary
          let cartSummary = '--- QUOTE REQUEST FROM CART ---\n\n'
          cartSummary += 'Products requested:\n\n'

          cart.forEach((item, index) => {
            cartSummary += `${index + 1}. ${item.name}\n`
            cartSummary += `   Category: ${item.category}\n`
            cartSummary += `   Quantity: ${item.quantity}\n`
            cartSummary += `   Est. Price: ${new Intl.NumberFormat('en-PH', {
              style: 'currency',
              currency: 'PHP',
              minimumFractionDigits: 0,
            }).format(item.price * item.quantity)}\n\n`
          })

          cartSummary += `Total Estimated Price: ${new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 0,
          }).format(total)}\n\n`
          cartSummary += '--- END OF CART SUMMARY ---\n\n'
          cartSummary += 'Additional notes:\n'

          setFormData(prev => ({
            ...prev,
            purpose: 'Product Demonstration',
            additionalInfo: cartSummary,
          }))

          // Clear cart data from localStorage after loading
          localStorage.removeItem('quoteCart')
          localStorage.removeItem('cartTotal')
        } catch (error) {
          console.error('Error parsing cart data:', error)
        }
      }
    }
  }, [location])

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await bookingService.create(formData)
      const bookingData = response.data

      // Reset form on success
      setFormData({
        date: '',
        time: '',
        company: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        purpose: '',
        location: '',
        product: '',
        additionalInfo: '',
      })
      onSubmit(true, undefined, bookingData)
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to submit booking. Please try again.'
      onSubmit(false, errorMessage)
    } finally {
      setLoading(false)
    }
  }
  const meetingPurposes = [
    'Product Demonstration',
    'Technical Consultation',
    'Calibration Services',
    'Software Training',
    'Maintenance Support',
    'General Inquiry',
    'Other',
  ]
  const meetingLocations = [
    'Accuro Office',
    'Client Site',
    'Virtual Meeting',
    'Other',
  ]
  const productCategories = [
    'Beamex Calibrators',
    'Beamex Calibration Benches',
    'Beamex Calibration Software',
    'Beamex Calibration Accessories',
    'Beamex Pressure Measurement',
    'Beamex Temperature Measurement',
    'Beamex Electrical Measurement',
    'Beamex Integrated Solutions',
    'Not sure / Need recommendation',
  ]
  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
        <LogIn className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Login Required</h3>
        <p className="text-gray-700 mb-6">
          You need to be logged in to schedule a meeting. This allows you to view and manage your bookings from your dashboard.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/login?redirect=/booking"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition font-medium"
          >
            Login to Continue
          </Link>
          <Link
            to="/register?redirect=/booking"
            className="inline-block bg-white text-blue-600 border-2 border-blue-600 px-6 py-3 rounded-md hover:bg-blue-50 transition font-medium"
          >
            Create Account
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Date Selection */}
      <div>
        <label
          htmlFor="date"
          className="flex items-center text-gray-700 font-medium mb-2"
        >
          <Calendar className="h-4 w-4 mr-2 text-blue-600" />
          Preferred Date
        </label>
        <input
          type="date"
          id="date"
          name="date"
          required
          value={formData.date}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      {/* Time Slot Picker */}
      <div>
        <label className="flex items-center text-gray-700 font-medium mb-2">
          <Clock className="h-4 w-4 mr-2 text-blue-600" />
          Select Time Slot
        </label>
        <TimeSlotPicker
          selectedDate={formData.date}
          selectedTime={formData.time}
          onTimeSelect={(time) => setFormData({ ...formData, time })}
        />
      </div>
      {/* Company Information */}
      <div>
        <label
          htmlFor="company"
          className="flex items-center text-gray-700 font-medium mb-2"
        >
          <Building className="h-4 w-4 mr-2 text-blue-600" />
          Company Name
        </label>
        <input
          type="text"
          id="company"
          name="company"
          required
          value={formData.company}
          onChange={handleChange}
          placeholder="Your company name"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label
            htmlFor="contactName"
            className="block text-gray-700 font-medium mb-2"
          >
            Contact Name
          </label>
          <input
            type="text"
            id="contactName"
            name="contactName"
            required
            value={formData.contactName}
            onChange={handleChange}
            placeholder="Full name"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label
            htmlFor="contactEmail"
            className="block text-gray-700 font-medium mb-2"
          >
            Email Address
          </label>
          <input
            type="email"
            id="contactEmail"
            name="contactEmail"
            required
            value={formData.contactEmail}
            onChange={handleChange}
            placeholder="email@company.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label
            htmlFor="contactPhone"
            className="block text-gray-700 font-medium mb-2"
          >
            Phone Number
          </label>
          <input
            type="tel"
            id="contactPhone"
            name="contactPhone"
            required
            value={formData.contactPhone}
            onChange={handleChange}
            placeholder="Your phone number"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      {/* Meeting Purpose */}
      <div>
        <label
          htmlFor="purpose"
          className="flex items-center text-gray-700 font-medium mb-2"
        >
          <FileText className="h-4 w-4 mr-2 text-blue-600" />
          Meeting Purpose
        </label>
        <select
          id="purpose"
          name="purpose"
          required
          value={formData.purpose}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="" disabled>
            Select purpose
          </option>
          {meetingPurposes.map((purpose) => (
            <option key={purpose} value={purpose}>
              {purpose}
            </option>
          ))}
        </select>
      </div>
      {/* Meeting Location */}
      <div>
        <label
          htmlFor="location"
          className="flex items-center text-gray-700 font-medium mb-2"
        >
          <MapPin className="h-4 w-4 mr-2 text-blue-600" />
          Meeting Location
        </label>
        <select
          id="location"
          name="location"
          required
          value={formData.location}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="" disabled>
            Select location
          </option>
          {meetingLocations.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>
      </div>
      {/* Product Interest */}
      <div>
        <label
          htmlFor="product"
          className="flex items-center text-gray-700 font-medium mb-2"
        >
          <Package className="h-4 w-4 mr-2 text-blue-600" />
          Product/Service of Interest
        </label>
        <select
          id="product"
          name="product"
          required
          value={formData.product}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="" disabled>
            Select product/service
          </option>
          {productCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      {/* Additional Information */}
      <div>
        <label
          htmlFor="additionalInfo"
          className="block text-gray-700 font-medium mb-2"
        >
          Additional Information
        </label>
        <textarea
          id="additionalInfo"
          name="additionalInfo"
          rows={4}
          value={formData.additionalInfo}
          onChange={handleChange}
          placeholder="Please provide any additional details that will help us prepare for the meeting..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
      </div>
      {/* Status Note */}
      <div className="bg-blue-50 border border-blue-100 rounded-md p-4">
        <p className="text-sm text-blue-800">
          <span className="font-semibold">Note:</span> Meeting requests are
          subject to confirmation. You will receive a confirmation email with
          the meeting status within 24 hours.
        </p>
      </div>
      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Submit Meeting Request'}
        </button>
      </div>
    </form>
  )
}
