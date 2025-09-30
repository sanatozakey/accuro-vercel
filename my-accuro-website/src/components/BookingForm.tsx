import React, { useState } from 'react'
import {
  Calendar,
  Clock,
  MapPin,
  Building,
  FileText,
  Package,
} from 'lucide-react'
interface BookingFormProps {
  onSubmit: () => void
}
export function BookingForm({ onSubmit }: BookingFormProps) {
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the data to your backend
    console.log('Form submitted:', formData)
    onSubmit()
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
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        {/* Time Selection */}
        <div>
          <label
            htmlFor="time"
            className="flex items-center text-gray-700 font-medium mb-2"
          >
            <Clock className="h-4 w-4 mr-2 text-blue-600" />
            Preferred Time
          </label>
          <input
            type="time"
            id="time"
            name="time"
            required
            value={formData.time}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
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
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-md transition"
        >
          Submit Meeting Request
        </button>
      </div>
    </form>
  )
}
