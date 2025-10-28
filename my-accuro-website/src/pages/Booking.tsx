import React, { useState, useEffect } from 'react'
import {
  Clock,
  FileText,
  CheckCircle,
  Info,
  AlertCircle,
  Calendar,
  Download,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { BookingForm } from '../components/BookingForm'
import bookingService from '../services/bookingService'
import { generateBookingReceipt } from '../utils/pdfGenerator'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Alert, AlertDescription } from '../components/ui/alert'

interface BookingItem {
  _id: string
  date: string
  time: string
  status: string
}

interface BookingData {
  _id: string
  date: string
  time: string
  company: string
  contactName: string
  contactEmail: string
  contactPhone: string
  purpose: string
  location: string
  product: string
  additionalInfo: string
  createdAt: string
}

export function Booking() {
  const [bookingSubmitted, setBookingSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [upcomingBookings, setUpcomingBookings] = useState<BookingItem[]>([])
  const [loadingBookings, setLoadingBookings] = useState(true)
  const [lastBookingData, setLastBookingData] = useState<BookingData | null>(null)

  // Fetch upcoming bookings to display in calendar
  const fetchUpcomingBookings = async () => {
    setLoadingBookings(true)
    try {
      const response = await bookingService.getUpcoming()

      // Filter for confirmed bookings in the future
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const upcoming = response.data
        .filter((booking: BookingItem) => {
          const bookingDate = new Date(booking.date)
          return bookingDate >= today && booking.status === 'confirmed' && booking.status !== 'completed'
        })
        .sort((a: BookingItem, b: BookingItem) => {
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        })
        .slice(0, 10) // Show only next 10 appointments

      setUpcomingBookings(upcoming)
    } catch (err: any) {
      // Silently fail - calendar is optional feature
      setUpcomingBookings([])
    } finally {
      setLoadingBookings(false)
    }
  }

  useEffect(() => {
    fetchUpcomingBookings()
  }, [])

  const handleBookingSubmit = (success: boolean, errorMessage?: string, bookingData?: any) => {
    if (success) {
      setBookingSubmitted(true)
      setError('')
      setLastBookingData(bookingData)
      // Refresh the calendar
      fetchUpcomingBookings()
      // Reset success message after 10 seconds
      setTimeout(() => {
        setBookingSubmitted(false)
        setLastBookingData(null)
      }, 10000)
    } else {
      setError(errorMessage || 'Failed to submit booking')
      setBookingSubmitted(false)
    }
  }

  const handleDownloadReceipt = () => {
    if (lastBookingData) {
      try {
        generateBookingReceipt({
          bookingId: lastBookingData._id,
          date: lastBookingData.date,
          time: lastBookingData.time,
          company: lastBookingData.company,
          contactName: lastBookingData.contactName,
          contactEmail: lastBookingData.contactEmail,
          contactPhone: lastBookingData.contactPhone,
          purpose: lastBookingData.purpose,
          location: lastBookingData.location,
          product: lastBookingData.product,
          additionalInfo: lastBookingData.additionalInfo,
          createdAt: lastBookingData.createdAt,
        })
      } catch (pdfError) {
        console.error('Failed to generate PDF:', pdfError)
        alert('Failed to download receipt. Please try again.')
      }
    }
  }

  return (
    <div className="w-full bg-background">
      {/* Booking Header */}
      <section className="bg-navy-900 text-white py-12 sm:py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-900 to-blue-900 opacity-90" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Badge className="mb-4 bg-blue-600 hover:bg-blue-700 text-white border-0">
            Book Meeting
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4">Schedule a Meeting</h1>
          <p className="max-w-3xl text-lg text-gray-200">
            Book a consultation with our team to discuss your calibration and
            instrumentation needs
          </p>
        </div>
      </section>

      {/* Booking Content */}
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12">
            {/* Booking Form */}
            <div className="lg:col-span-2">
              <Card className="border-2 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl sm:text-3xl md:text-4xl">Meeting Request Form</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {bookingSubmitted && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <h3 className="font-medium mb-1">
                          Meeting request submitted successfully!
                        </h3>
                        <p className="text-green-700 mb-3">
                          We'll review your request and get back to you within
                          24 hours to confirm your appointment.
                        </p>
                        {lastBookingData && (
                          <Button
                            onClick={handleDownloadReceipt}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download Receipt (PDF)
                          </Button>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-5 w-5" />
                      <AlertDescription>
                        <h3 className="font-medium">Error submitting booking</h3>
                        <p className="text-sm mt-1">{error}</p>
                      </AlertDescription>
                    </Alert>
                  )}
                  <BookingForm onSubmit={handleBookingSubmit} />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Information */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-2 shadow-lg bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-xl sm:text-2xl">What to Expect</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    <li className="flex">
                      <Clock className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                      <p className="text-muted-foreground">
                        Meetings typically last 30-60 minutes depending on the
                        complexity of your requirements
                      </p>
                    </li>
                    <li className="flex">
                      <CheckCircle className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                      <p className="text-muted-foreground">
                        Our team will prepare a personalized demonstration of
                        relevant products
                      </p>
                    </li>
                    <li className="flex">
                      <FileText className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                      <p className="text-muted-foreground">
                        We'll provide a detailed quote following the meeting based
                        on your needs
                      </p>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 shadow-lg bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-xl sm:text-2xl">
                    Need Immediate Assistance?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    If you have urgent requirements or questions, please don't
                    hesitate to contact us directly:
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center">
                      <Info className="h-5 w-5 text-blue-600 mr-3" />
                      <span className="text-foreground font-medium">
                        +63 9171507737
                      </span>
                    </li>
                    <li className="flex items-center">
                      <Info className="h-5 w-5 text-blue-600 mr-3" />
                      <span className="text-foreground font-medium">
                        info@accuro.com.ph
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Upcoming Appointments Calendar */}
              <Card className="border-2 shadow-lg">
                <CardHeader>
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                    <CardTitle className="text-xl sm:text-2xl">Scheduled Appointments</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingBookings ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground text-sm">Loading appointments...</p>
                    </div>
                  ) : upcomingBookings.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingBookings.map((booking) => (
                        <div
                          key={booking._id}
                          className="border-l-4 border-blue-500 bg-muted/50 p-3 rounded-r"
                        >
                          <div className="flex items-center text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                            <span className="font-medium">
                              {new Date(booking.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center text-sm mt-1">
                            <Clock className="h-4 w-4 text-muted-foreground mr-2" />
                            <span className="text-muted-foreground">{booking.time}</span>
                            <Badge
                              className={`ml-auto ${
                                booking.status === 'confirmed'
                                  ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                  : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                              }`}
                              variant="secondary"
                            >
                              {booking.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      <p className="text-xs text-muted-foreground mt-3 text-center">
                        Please select a time that doesn't conflict with existing appointments
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">
                        No upcoming appointments scheduled
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}