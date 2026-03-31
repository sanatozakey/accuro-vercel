import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Award, Users, TrendingUp, Search, FileText, ClipboardList, UserCheck, CalendarCheck } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { TestimonialsSection } from '../components/TestimonialsSection'

export function Home() {
  return (
    <div className="w-full bg-background">
      {/* Hero Section */}
      <section className="bg-navy-900 text-white py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-900 to-blue-900 opacity-90" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Instrumentation & Calibration Solutions
            </h1>
            <p className="text-lg sm:text-xl mb-8 text-gray-200 max-w-2xl">
              Providing high-quality measurement and calibration equipment for
              industrial applications with precision and reliability
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                <Link to="/products">
                  Explore Products
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-2 border-white bg-transparent text-white hover:bg-white hover:text-navy-900">
                <Link to="/contact">
                  Contact Us
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Strip */}
      <section className="py-8 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Certified Quality</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">ISO-compliant solutions</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Expert Support</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Dedicated technical team</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Industry Leader</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Trusted by top companies</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-24 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">How It Works</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              From browsing to service completion — here's your journey with Accuro
            </p>
          </div>
          <div className="relative max-w-6xl mx-auto">
            {/* Connector lines (desktop only) */}
            <div className="hidden lg:block absolute top-16 left-[calc(10%+24px)] right-[calc(10%+24px)] h-0.5 bg-blue-200 dark:bg-blue-800" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-6">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative z-10 h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold shadow-lg">
                  1
                </div>
                <div className="h-14 w-14 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                  <Search className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Browse Products</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                  Explore our range of Beamex calibration equipment and find the right solution.
                </p>
              </div>
              {/* Step 2 */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative z-10 h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold shadow-lg">
                  2
                </div>
                <div className="h-14 w-14 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                  <FileText className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Request a Quote or Book a Meeting</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                  Submit a quotation request or schedule a consultation with our team.
                </p>
              </div>
              {/* Step 3 */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative z-10 h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold shadow-lg">
                  3
                </div>
                <div className="h-14 w-14 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                  <ClipboardList className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Review & Accept Your Quote</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                  Receive a detailed quotation, review it, and accept or request revisions.
                </p>
              </div>
              {/* Step 4 */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative z-10 h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold shadow-lg">
                  4
                </div>
                <div className="h-14 w-14 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                  <UserCheck className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Technician Dispatched</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                  A certified technician is assigned to your booking and dispatched to your location.
                </p>
              </div>
              {/* Step 5 */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative z-10 h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold shadow-lg">
                  5
                </div>
                <div className="h-14 w-14 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                  <CalendarCheck className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Service Completed</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                  Your technician completes the service and submits a verified completion report.
                </p>
              </div>
            </div>
          </div>
          <div className="text-center mt-12">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Link to="/products">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Who We Are Section */}
      <section className="py-16 sm:py-24 dark:bg-gray-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">Who We Are</h2>
              </div>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                Accuro is a leading provider of high-quality instrumentation and
                calibration solutions for various industries. We specialize in
                Beamex products, offering the best measurement and calibration
                equipment to ensure accuracy and reliability in your operations.
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                With years of experience and expertise, we help our clients
                optimize their processes, improve efficiency, and maintain
                compliance with industry standards.
              </p>
              <Button asChild variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-800">
                <Link to="/about" className="inline-flex items-center text-lg">
                  Learn more about us
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg blur opacity-20"></div>
              <Card className="relative overflow-hidden border-2">
                <CardContent className="p-0">
                  <img
                    src="https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                    alt="Industrial facility"
                    className="w-full h-auto rounded-lg"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Backed by Company */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Backed by Industry Leaders
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Partnering with the best to deliver exceptional calibration solutions
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-600 dark:bg-gray-900 dark:border-gray-800">
              <CardHeader className="p-0">
                <div className="h-48 overflow-hidden rounded-t-lg">
                  <img
                    src="https://www.beamex.com/app/uploads/2020/05/Beamex-webshop_big-tablet_v1-e1590471740956.jpeg"
                    alt="Beamex"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Official Distributor</span>
                </div>
                <p className="text-base text-gray-700 dark:text-gray-300">
                  Official distributor of Beamex calibration equipment and
                  software solutions
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-600 dark:bg-gray-900 dark:border-gray-800">
              <CardHeader className="p-0">
                <div className="h-48 overflow-hidden rounded-t-lg">
                  <img
                    src="https://images.unsplash.com/photo-1560179707-f14e90ef3623?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                    alt="Company office"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Strategic Partners</span>
                </div>
                <p className="text-base text-gray-700 dark:text-gray-300">
                  Partnered with leading industrial automation companies
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-600 dark:bg-gray-900 dark:border-gray-800">
              <CardHeader className="p-0">
                <div className="h-48 overflow-hidden rounded-t-lg">
                  <img
                    src="https://images.unsplash.com/photo-1581092335397-9583eb92d232?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                    alt="Industrial equipment"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Certified Experts</span>
                </div>
                <p className="text-base text-gray-700 dark:text-gray-300">
                  Certified experts in measurement and calibration technologies
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Products Preview */}
      <section className="py-16 sm:py-24 dark:bg-gray-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">Our Products</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              We offer a comprehensive range of Beamex calibration equipment and
              accessories for various industrial applications
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-2 hover:border-blue-600">
              <CardHeader className="p-0">
                <div className="h-48 bg-gray-50 flex items-center justify-center p-4 group-hover:bg-gray-100 transition-colors">
                  <img
                    src="/images/Beamex MC6.png"
                    alt="Beamex MC6"
                    className="w-full h-full object-contain"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <CardTitle className="mb-2 text-xl">Beamex MC6</CardTitle>
                <CardDescription className="mb-4">
                  Advanced field calibrator and communicator
                </CardDescription>
                <Button asChild variant="ghost" className="w-full justify-start p-0 h-auto text-blue-600 hover:text-blue-800 hover:bg-transparent">
                  <Link to="/products/mc6" className="inline-flex items-center">
                    View details
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-2 hover:border-blue-600">
              <CardHeader className="p-0">
                <div className="h-48 bg-gray-50 flex items-center justify-center p-4 group-hover:bg-gray-100 transition-colors">
                  <img
                    src="/images/Beamex MC6.png"
                    alt="Beamex MC4"
                    className="w-full h-full object-contain"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <CardTitle className="mb-2 text-xl">Beamex MC4</CardTitle>
                <CardDescription className="mb-4">
                  Documenting process calibrator
                </CardDescription>
                <Button asChild variant="ghost" className="w-full justify-start p-0 h-auto text-blue-600 hover:text-blue-800 hover:bg-transparent">
                  <Link to="/products/mc4" className="inline-flex items-center">
                    View details
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-2 hover:border-blue-600">
              <CardHeader className="p-0">
                <div className="h-48 bg-gray-50 flex items-center justify-center p-4 group-hover:bg-gray-100 transition-colors">
                  <img
                    src="/images/Beamex FB.png"
                    alt="Beamex FB Series"
                    className="w-full h-full object-contain"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <CardTitle className="mb-2 text-xl">Beamex FB Series</CardTitle>
                <CardDescription className="mb-4">
                  Field temperature block
                </CardDescription>
                <Button asChild variant="ghost" className="w-full justify-start p-0 h-auto text-blue-600 hover:text-blue-800 hover:bg-transparent">
                  <Link to="/products/fb150" className="inline-flex items-center">
                    View details
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-2 hover:border-blue-600">
              <CardHeader className="p-0">
                <div className="h-48 bg-gray-50 flex items-center justify-center p-4 group-hover:bg-gray-100 transition-colors">
                  <img
                    src="/images/Beamex MC6.png"
                    alt="Beamex CMX"
                    className="w-full h-full object-contain"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <CardTitle className="mb-2 text-xl">Beamex CMX</CardTitle>
                <CardDescription className="mb-4">
                  Calibration management software
                </CardDescription>
                <Button asChild variant="ghost" className="w-full justify-start p-0 h-auto text-blue-600 hover:text-blue-800 hover:bg-transparent">
                  <Link to="/products/cmx" className="inline-flex items-center">
                    View details
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-10">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Link to="/products">
                View All Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialsSection maxReviews={6} />

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-navy-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-900 to-blue-900 opacity-90" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg sm:text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Know what you need? Request a quote. Not sure yet? Book a free consultation with our experts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-navy-900 hover:bg-gray-100">
              <Link to="/products">
                Browse Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Link to="/request-quote">
                Request a Quote
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-2 border-white bg-transparent text-white hover:bg-white hover:text-navy-900">
              <Link to="/booking">
                Book a Consultation
              </Link>
            </Button>
          </div>
        </div>
      </section>

    </div>
  )
}
