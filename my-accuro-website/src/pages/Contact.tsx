import React, { useState, useEffect } from 'react'
import { Mail, Phone, MapPin, Send, CheckCircle, AlertCircle } from 'lucide-react'
import contactService from '../services/contactService'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Label } from '../components/ui/label'

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
    <div className="w-full bg-background">
      {/* Contact Header */}
      <section className="bg-navy-900 text-white py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-900 to-blue-900 opacity-90" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Badge className="mb-4 bg-blue-600 hover:bg-blue-700 text-white border-0">
            Contact Us
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            Get In Touch With Us
          </h1>
          <p className="text-lg sm:text-xl text-gray-200 max-w-3xl">
            Have questions about our products or services? Contact us today and
            our team will be happy to assist you.
          </p>
        </div>
      </section>
      {/* Contact Form and Info */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">Send Us a Message</h2>

              {success && (
                <Alert className="mb-6 bg-green-50 border-green-200">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <AlertDescription className="ml-2">
                    <h3 className="text-base font-semibold text-green-800">Message sent successfully!</h3>
                    <p className="text-green-700 mt-1 text-sm">
                      We'll get back to you as soon as possible.
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-5 w-5" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Card className="border-2 shadow-lg">
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="firstName">
                          First Name *
                        </Label>
                        <Input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          placeholder="Your first name"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">
                          Last Name *
                        </Label>
                        <Input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          placeholder="Your last name"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">
                        Email Address *
                      </Label>
                      <Input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Your email address"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">
                        Phone Number *
                      </Label>
                      <Input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Your phone number"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="company">
                        Company
                      </Label>
                      <Input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        placeholder="Your company name (optional)"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subject">
                        Subject *
                      </Label>
                      <Input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="Message subject"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="message">
                        Message *
                      </Label>
                      <Textarea
                        id="message"
                        name="message"
                        rows={5}
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Your message (minimum 20 characters)"
                        minLength={20}
                        maxLength={2000}
                        required
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        {formData.message.length}/2000 characters (minimum 20)
                      </p>
                    </div>
                    <div>
                      <Button
                        type="submit"
                        disabled={loading}
                        size="lg"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {loading ? 'Sending...' : 'Send Message'}
                        <Send size={18} className="ml-2" />
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
            {/* Contact Information */}
            <div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">Contact Information</h2>
              <Card className="border-2 shadow-lg mb-8">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="flex items-start">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mr-4 flex-shrink-0">
                        <Phone className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Phone</h3>
                        <p className="text-gray-600">+63 9171507737</p>
                        <p className="text-sm text-muted-foreground">
                          Monday to Friday, 9am to 5pm PHT
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mr-4 flex-shrink-0">
                        <Mail className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Email</h3>
                        <p className="text-gray-600">info@accuro.com.ph</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mr-4 flex-shrink-0">
                        <MapPin className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
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
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Map */}
              <Card className="border-2 shadow-lg overflow-hidden">
                <CardContent className="p-0">
                  <div className="h-80 bg-gray-200">
                    <iframe
                      title="Office Location"
                      className="w-full h-full border-0"
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3860.7261733200024!2d121.02761!3d14.6163!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b7aad9b237c3%3A0x57ab136f4a90ee96!2sViera%20Residences%2C%20Scout%20Tuazon%2C%20Quezon%20City%2C%20Metro%20Manila!5e0!3m2!1sen!2sph!4v1654567890123!5m2!1sen!2sph"
                      allowFullScreen
                      loading="lazy"
                    ></iframe>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
