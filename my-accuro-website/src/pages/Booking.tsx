import React, { useState } from 'react'
import {
  Calendar,
  Clock,
  MapPin,
  Building,
  FileText,
  Package,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { BookingForm } from '../components/BookingForm'

export function Booking() {
  const [bookingSubmitted, setBookingSubmitted] = useState(false)

  const handleBookingSubmit = () => {
    // In a real application, this would submit the form data to a backend
    setBookingSubmitted(true)
    // Reset form state after 5 seconds
    setTimeout(() => setBookingSubmitted(false), 5000)
  }

  return (
    <div className="w-full bg-white">
      {/* Booking Header */}
      <section className="bg-navy-900 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold">Schedule a Meeting</h1>
          <p className="mt-4 max-w-3xl">
            Book a consultation with our team to discuss your calibration and
            instrumentation needs
          </p>
        </div>
      </section>

      {/* Booking Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Booking Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Meeting Request Form</h2>
                </div>
                {bookingSubmitted ? (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                    <div className="flex">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <div>
                        <h3 className="text-green-800 font-medium">
                          Meeting request submitted successfully!
                        </h3>
                        <p className="text-green-700 mt-1">
                          We'll review your request and get back to you within
                          24 hours to confirm your appointment.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
                <BookingForm onSubmit={handleBookingSubmit} />
              </div>
            </div>

            {/* Sidebar Information */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-lg shadow-md border border-gray-200 p-6 mb-6">
                <h3 className="text-xl font-bold mb-4">What to Expect</h3>
                <ul className="space-y-4">
                  <li className="flex">
                    <Clock className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700">
                      Meetings typically last 30-60 minutes depending on the
                      complexity of your requirements
                    </p>
                  </li>
                  <li className="flex">
                    <CheckCircle className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700">
                      Our team will prepare a personalized demonstration of
                      relevant products
                    </p>
                  </li>
                  <li className="flex">
                    <FileText className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700">
                      We'll provide a detailed quote following the meeting based
                      on your needs
                    </p>
                  </li>
                </ul>
              </div>
              <div className="bg-blue-50 rounded-lg shadow-md border border-blue-100 p-6">
                <h3 className="text-xl font-bold mb-4">
                  Need Immediate Assistance?
                </h3>
                <p className="text-gray-700 mb-4">
                  If you have urgent requirements or questions, please don't
                  hesitate to contact us directly:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Info className="h-5 w-5 text-blue-600 mr-3" />
                    <span className="text-gray-800 font-medium">
                      +63 9171507737
                    </span>
                  </li>
                  <li className="flex items-center">
                    <Info className="h-5 w-5 text-blue-600 mr-3" />
                    <span className="text-gray-800 font-medium">
                      info@accuro.com.ph
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8">Featured Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-200">
              <img
                src="/images/Beamex MC6.png"
                alt="Beamex MC6"
                className="w-full h-48 object-contain p-4"
              />
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2">Beamex MC6</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Advanced field calibrator and communicator
                </p>
                <Link
                  to="/products"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View details
                </Link>
              </div>
            </div>
            <div className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-200">
              <img
                src="/images/Beamex CENTRiCAL.png"
                alt="Beamex CENTRiCAL"
                className="w-full h-48 object-contain p-4"
              />
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2">Beamex CENTRiCAL</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Temperature calibration system
                </p>
                <Link
                  to="/products"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View details
                </Link>
              </div>
            </div>
            <div className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-200">
              <img
                src="/images/Beamex Temperature Sensors.png"
                alt="Beamex Temperature Sensors"
                className="w-full h-48 object-contain p-4"
              />
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2">Temperature Sensors</h3>
                <p className="text-gray-600 text-sm mb-3">
                  High-precision temperature sensors
                </p>
                <Link
                  to="/products"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View details
                </Link>
              </div>
            </div>
            <div className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-200">
              <img
                src="/images/Calibration Pumps.png"
                alt="Calibration Pumps"
                className="w-full h-48 object-contain p-4"
              />
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2">Calibration Pumps</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Pressure generation equipment
                </p>
                <Link
                  to="/products"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View details
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}