import React, { lazy } from 'react'
import { Mail, Phone, MapPin, Send } from 'lucide-react'
export function Contact() {
  return (
    <div className="w-full bg-white">
      {/* Contact Header */}
      <section className="bg-navy-900 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold">
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
              <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-gray-700 font-medium mb-2"
                    >
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Your first name"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-gray-700 font-medium mb-2"
                    >
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Your last name"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your email address"
                  />
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your phone number"
                  />
                </div>
                <div>
                  <label
                    htmlFor="subject"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Message subject"
                  />
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your message"
                  ></textarea>
                </div>
                <div>
                  <button
                    type="submit"
                    className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-md transition"
                  >
                    Send Message
                    <Send size={18} className="ml-2" />
                  </button>
                </div>
              </form>
            </div>
            {/* Contact Information */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
              <div className="bg-gray-50 p-6 rounded-lg shadow-sm mb-8">
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <Phone className="text-blue-600 mr-4 mt-1" size={20} />
                    <div>
                      <h3 className="font-semibold text-gray-800">Phone</h3>
                      <p className="text-gray-600">+63 9171507737</p>
                      <p className="text-gray-600">
                        Monday to Friday, 9am to 5pm PHT
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Mail className="text-blue-600 mr-4 mt-1" size={20} />
                    <div>
                      <h3 className="font-semibold text-gray-800">Email</h3>
                      <p className="text-gray-600">info@accuro.com.ph</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <MapPin className="text-blue-600 mr-4 mt-1" size={20} />
                    <div>
                      <h3 className="font-semibold text-gray-800">
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
