import React, { useState, useEffect } from 'react'
import { Mail, Phone, MapPin, Send, CheckCircle, AlertCircle } from 'lucide-react'
import contactService from '../services/contactService'
import { useAuth } from '../contexts/AuthContext'

export function Contact() {
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    subject: '',
    message: '',
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Auto-fill form for logged-in users
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        company: user.company || prev.company,
      }))
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Frontend validation
    if (formData.message.length < 20) {
      setError('Message must be at least 20 characters long. You currently have ' + formData.message.length + ' characters.')
      return
    }

    if (formData.message.length > 2000) {
      setError('Message must be no more than 2000 characters long.')
      return
    }

    setLoading(true)

    try {
      await contactService.create(formData)
      setSuccess(true)
      setFormData({
        firstName: '',
        lastName: '',
        email: user?.email || '',
        phone: user?.phone || '',
        company: user?.company || '',
        subject: '',
        message: '',
      })
      setTimeout(() => setSuccess(false), 5000)
    } catch (err: any) {
      // Show detailed validation errors if available
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const errorMessages = err.response.data.errors.map((e: any) =>
          `${e.field}: ${e.message}`
        ).join(', ');
        setError(errorMessages);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to send message. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full bg-white">
      {/* Contact Header */}
      <section className="bg-navy-900 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-bold">
            Get In Touch With Us
          </h1>
          <p className="mt-4 max-w-3xl">
            Have questions about our products or services? Contact us today and
            our team will be happy to assist you.
          </p>
        </div>
      </section>
      {/* Contact Form and Info */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Send Us a Message</h2>

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                  <div className="flex">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <div>
                      <h3 className="text-2xl md:text-3xl font-semibold text-green-800">Message sent successfully!</h3>
                      <p className="text-green-700 mt-1 text-sm">
                        We'll get back to you as soon as possible.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-gray-700 font-medium mb-2"
                    >
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Your first name"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-gray-700 font-medium mb-2"
                    >
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Your last name"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your email address"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your phone number"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="company"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Company
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your company name (optional)"
                  />
                </div>
                <div>
                  <label
                    htmlFor="subject"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Message subject"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your message (minimum 20 characters)"
                    minLength={20}
                    maxLength={2000}
                    required
                  ></textarea>
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.message.length}/2000 characters (minimum 20)
                  </p>
                </div>
                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending...' : 'Send Message'}
                    <Send size={18} className="ml-2" />
                  </button>
                </div>
              </form>
            </div>
            {/* Contact Information */}
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Contact Information</h2>
              <div className="bg-gray-50 p-6 rounded-lg shadow-sm mb-8">
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <Phone className="text-blue-600 mr-4 mt-1" size={20} />
                    <div>
                      <h3 className="text-2xl md:text-3xl font-semibold text-gray-800">Phone</h3>
                      <p className="text-gray-600">+63 9171507737</p>
                      <p className="text-gray-600">
                        Monday to Friday, 9am to 5pm PHT
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Mail className="text-blue-600 mr-4 mt-1" size={20} />
                    <div>
                      <h3 className="text-2xl md:text-3xl font-semibold text-gray-800">Email</h3>
                      <p className="text-gray-600">info@accuro.com.ph</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <MapPin className="text-blue-600 mr-4 mt-1" size={20} />
                    <div>
                      <h3 className="text-2xl md:text-3xl font-semibold text-gray-800">
                        Office Address
                      </h3>
                      <p className="text-gray-600">
                        Unit 2229, Viera Residences
                      </p>
                      <p className="text-gray-600">
                        Scout Tuason Avenue, Barangay Obrero
                      </p>
                      <p className="text-gray-600">Quezon City, Philippines</p>
                    </div>
                  </li>
                </ul>
              </div>
              {/* Map */}
              <div className="rounded-lg overflow-hidden shadow-md h-80 bg-gray-200">
                <iframe
                  title="Office Location"
                  className="w-full h-full border-0"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3860.7261733200024!2d121.02761!3d14.6163!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b7aad9b237c3%3A0x57ab136f4a90ee96!2sViera%20Residences%2C%20Scout%20Tuazon%2C%20Quezon%20City%2C%20Metro%20Manila!5e0!3m2!1sen!2sph!4v1654567890123!5m2!1sen!2sph"
                  allowFullScreen
                  loading="lazy"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
