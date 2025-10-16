import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export function Home() {
  return (
    <div className="w-full bg-white">
      {/* Hero Section */}
      <section className="bg-navy-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Instrumentation & Calibration Solutions
            </h1>
            <p className="text-xl mb-8">
              Providing high-quality measurement and calibration equipment for
              industrial applications
            </p>
            <Link
              to="/products"
              className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-md transition"
            >
              Explore Products
              <ArrowRight size={20} className="ml-2" />
            </Link>
          </div>
        </div>
      </section>
      
      {/* Who We Are Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Who We Are</h2>
              <p className="text-gray-700 mb-4">
                Accuro is a leading provider of high-quality instrumentation and
                calibration solutions for various industries. We specialize in
                Beamex products, offering the best measurement and calibration
                equipment to ensure accuracy and reliability in your operations.
              </p>
              <p className="text-gray-700 mb-6">
                With years of experience and expertise, we help our clients
                optimize their processes, improve efficiency, and maintain
                compliance with industry standards.
              </p>
              <Link
                to="/about"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                Learn more about us
                <ArrowRight size={18} className="ml-1" />
              </Link>
            </div>
            <div className="rounded-lg overflow-hidden shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                alt="Industrial facility"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Backed by Company */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">
            Backed by Industry Leaders
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <img
                src="https://www.beamex.com/app/uploads/2020/05/Beamex-webshop_big-tablet_v1-e1590471740956.jpeg"
                alt="Beamex"
                className="h-40 w-full object-cover rounded mb-4"
              />
              <p className="text-gray-700">
                Official distributor of Beamex calibration equipment and
                software solutions
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <img
                src="https://images.unsplash.com/photo-1560179707-f14e90ef3623?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                alt="Company office"
                className="h-40 w-full object-cover rounded mb-4"
              />
              <p className="text-gray-700">
                Partnered with leading industrial automation companies
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <img
                src="https://images.unsplash.com/photo-1581092335397-9583eb92d232?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                alt="Industrial equipment"
                className="h-40 w-full object-cover rounded mb-4"
              />
              <p className="text-gray-700">
                Certified experts in measurement and calibration technologies
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Our Products Preview */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Our Products</h2>
            <p className="text-gray-700 max-w-3xl mx-auto">
              We offer a comprehensive range of Beamex calibration equipment and
              accessories for various industrial applications
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-200">
              <img
                src="/images/Beamex MC6.png"
                alt="Beamex MC6"
                className="w-full h-48 object-contain p-4"
              />
              <div className="p-4">
                <h3 className="text-2xl md:text-3xl font-semibold mb-2">Beamex MC6</h3>
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
                src="/images/Beamex MC6.png"
                alt="Beamex MC4"
                className="w-full h-48 object-contain p-4"
              />
              <div className="p-4">
                <h3 className="text-2xl md:text-3xl font-semibold mb-2">Beamex MC4</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Documenting process calibrator
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
                src="/images/Beamex FB.png"
                alt="Beamex FB Series"
                className="w-full h-48 object-contain p-4"
              />
              <div className="p-4">
                <h3 className="text-2xl md:text-3xl font-semibold mb-2">Beamex FB Series</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Field temperature block
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
                src="/images/Beamex MC6.png"
                alt="Beamex CMX"
                className="w-full h-48 object-contain p-4"
              />
              <div className="p-4">
                <h3 className="text-2xl md:text-3xl font-semibold mb-2">Beamex CMX</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Calibration management software
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
          <div className="text-center mt-10">
            <Link
              to="/products"
              className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-md transition"
            >
              View All Products
              <ArrowRight size={20} className="ml-2" />
            </Link>
          </div>
        </div>
      </section>
      
      {/* Why We Work at Accuro */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="rounded-lg overflow-hidden shadow-lg order-2 md:order-1">
              <img
                src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                alt="Team working together"
                className="w-full h-auto"
              />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Why We Work at Accuro</h2>
              <p className="text-gray-700 mb-4">
                At Accuro, we're passionate about providing the best calibration
                solutions to our clients. Our team consists of dedicated
                professionals who are experts in their field and committed to
                delivering excellence.
              </p>
              <p className="text-gray-700 mb-6">
                We believe in building long-term relationships with our clients,
                understanding their unique needs, and offering tailored
                solutions that help them achieve their goals.
              </p>
              <Link
                to="/about"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                Meet our team
                <ArrowRight size={18} className="ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}