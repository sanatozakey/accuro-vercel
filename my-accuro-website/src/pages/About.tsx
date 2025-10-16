import React from 'react'
export function About() {
  return (
    <div className="w-full bg-white">
      {/* About Header */}
      <section className="bg-navy-900 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-bold">About Us</h1>
          <p className="mt-4 max-w-3xl">
            Learn more about Accuro and our commitment to providing high-quality
            instrumentation and calibration solutions
          </p>
        </div>
      </section>
      {/* Company Overview */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Our Company</h2>
              <p className="text-gray-700 mb-4">
                Accuro is a leading provider of high-quality instrumentation and
                calibration solutions for various industries. We specialize in
                Beamex products, offering the best measurement and calibration
                equipment to ensure accuracy and reliability in your operations.
              </p>
              <p className="text-gray-700 mb-4">
                Founded with a vision to deliver excellence in calibration
                technology, we have grown to become a trusted partner for
                businesses across the Philippines and beyond. Our team of
                experts is dedicated to understanding your unique needs and
                providing tailored solutions that help you achieve optimal
                performance.
              </p>
              <p className="text-gray-700">
                At Accuro, we believe in building long-term relationships with
                our clients, providing not just products but complete solutions
                that include training, support, and maintenance services.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img
                src="https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                alt="Industrial facility"
                className="rounded-lg shadow-lg"
              />
              <img
                src="https://images.unsplash.com/photo-1581092335397-9583eb92d232?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                alt="Industrial equipment"
                className="rounded-lg shadow-lg mt-8"
              />
              <img
                src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                alt="Calibration equipment"
                className="rounded-lg shadow-lg"
              />
              <img
                src="https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                alt="Industrial worker"
                className="rounded-lg shadow-lg mt-8"
              />
            </div>
          </div>
        </div>
      </section>
      {/* Who We Serve */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold mb-10 text-center">Who We Serve</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <img
                src="https://images.unsplash.com/photo-1461988091159-192b6df7054f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                alt="Oil and gas industry"
                className="w-full h-48 object-cover rounded mb-4"
              />
              <h3 className="text-2xl md:text-3xl font-semibold mb-3">Oil & Gas</h3>
              <p className="text-gray-700">
                We provide reliable calibration solutions for the oil and gas
                industry, ensuring accurate measurements and compliance with
                safety standards.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <img
                src="https://images.unsplash.com/photo-1563245372-f21724e3856d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                alt="Pharmaceutical industry"
                className="w-full h-48 object-cover rounded mb-4"
              />
              <h3 className="text-2xl md:text-3xl font-semibold mb-3">Pharmaceutical</h3>
              <p className="text-gray-700">
                Our calibration solutions help pharmaceutical companies maintain
                precise measurements required for quality control and regulatory
                compliance.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <img
                src="https://images.unsplash.com/photo-1498084393753-b411b2d26b34?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                alt="Power generation industry"
                className="w-full h-48 object-cover rounded mb-4"
              />
              <h3 className="text-2xl md:text-3xl font-semibold mb-3">Power Generation</h3>
              <p className="text-gray-700">
                We serve power generation facilities with calibration equipment
                that ensures efficient operations and compliance with
                environmental regulations.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
