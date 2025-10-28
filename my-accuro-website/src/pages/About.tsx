import React from 'react'
import { Building2, Target, Users, Award, TrendingUp, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

export function About() {
  return (
    <div className="w-full bg-background">
      {/* About Header */}
      <section className="bg-navy-900 text-white py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-900 to-blue-900 opacity-90" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Badge className="mb-4 bg-blue-600 hover:bg-blue-700 text-white border-0">
            About Accuro
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold">About Us</h1>
          <p className="mt-6 max-w-3xl text-lg sm:text-xl text-gray-200">
            Learn more about Accuro and our commitment to providing high-quality
            instrumentation and calibration solutions
          </p>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4">Our Values</Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              What Drives Us
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-600 dark:bg-gray-900 dark:border-gray-800">
              <CardHeader>
                <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
                  <Target className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>Precision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base text-gray-700 dark:text-gray-300">
                  Delivering accurate measurements and reliable calibration solutions that meet the highest industry standards
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-600 dark:bg-gray-900 dark:border-gray-800">
              <CardHeader>
                <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
                  <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base text-gray-700 dark:text-gray-300">
                  Partnering with industry leaders like Beamex to provide world-class calibration equipment and software
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-600 dark:bg-gray-900 dark:border-gray-800">
              <CardHeader>
                <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>Partnership</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base text-gray-700 dark:text-gray-300">
                  Building long-term relationships with our clients through exceptional service and dedicated support
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Company Overview */}
      <section className="py-16 sm:py-24 dark:bg-gray-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div>
                <Badge className="mb-4">Our Story</Badge>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">Our Company</h2>
              </div>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                Accuro is a leading provider of high-quality instrumentation and
                calibration solutions for various industries. We specialize in
                Beamex products, offering the best measurement and calibration
                equipment to ensure accuracy and reliability in your operations.
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                Founded with a vision to deliver excellence in calibration
                technology, we have grown to become a trusted partner for
                businesses across the Philippines and beyond. Our team of
                experts is dedicated to understanding your unique needs and
                providing tailored solutions that help you achieve optimal
                performance.
              </p>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                At Accuro, we believe in building long-term relationships with
                our clients, providing not just products but complete solutions
                that include training, support, and maintenance services.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="overflow-hidden border-2">
                <CardContent className="p-0">
                  <img
                    src="/images/Beamex MC6.png"
                    alt="Beamex MC6 Calibrator"
                    className="w-full h-full object-contain bg-gray-50 p-4"
                  />
                </CardContent>
              </Card>
              <Card className="overflow-hidden border-2 mt-8">
                <CardContent className="p-0">
                  <img
                    src="/images/Beamex CENTRiCAL.png"
                    alt="Beamex CENTRiCAL"
                    className="w-full h-full object-contain bg-gray-50 p-4"
                  />
                </CardContent>
              </Card>
              <Card className="overflow-hidden border-2">
                <CardContent className="p-0">
                  <img
                    src="/images/Beamex Temperature Sensors.png"
                    alt="Beamex Temperature Sensors"
                    className="w-full h-full object-contain bg-gray-50 p-4"
                  />
                </CardContent>
              </Card>
              <Card className="overflow-hidden border-2 mt-8">
                <CardContent className="p-0">
                  <img
                    src="/images/Calibration Pumps.png"
                    alt="Calibration Pumps"
                    className="w-full h-full object-contain bg-gray-50 p-4"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Why We Work at Accuro */}
      <section className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4">Our Mission</Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">Why We Work at Accuro</h2>
            </div>
            <Card className="border-2 dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-8 space-y-6">
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                  At Accuro, we're driven by a passion for precision and excellence. Our team consists of
                  dedicated professionals who are experts in calibration technology and committed to
                  delivering the highest quality solutions to our clients.
                </p>
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                  We believe in the power of accurate measurements to transform industrial operations.
                  Whether it's ensuring safety compliance, improving process efficiency, or maintaining
                  product quality, we understand that calibration is not just a service—it's a critical
                  component of operational success.
                </p>
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                  Our mission is to empower businesses with reliable calibration equipment and expert
                  support. We work closely with each client to understand their unique challenges and
                  provide tailored solutions that meet their specific needs. By partnering with industry
                  leaders like Beamex, we ensure our clients have access to the most advanced calibration
                  technology available.
                </p>
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                  What sets us apart is our commitment to building long-term relationships. We don't just
                  sell equipment—we provide comprehensive solutions that include training, ongoing support,
                  and maintenance services to ensure our clients achieve optimal results.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Who We Serve */}
      <section className="py-16 sm:py-24 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4">Industries</Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Who We Serve</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Providing calibration solutions across diverse industries with precision and reliability
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-600">
              <CardHeader className="p-0">
                <div className="h-48 overflow-hidden rounded-t-lg bg-gray-50">
                  <img
                    src="/images/Beamex MC6-Ex.png"
                    alt="Beamex MC6-Ex for Oil & Gas"
                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-xl">Oil & Gas</CardTitle>
                </div>
                <CardDescription className="text-base text-gray-700">
                  We provide reliable calibration solutions for the oil and gas
                  industry, ensuring accurate measurements and compliance with
                  safety standards.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-600">
              <CardHeader className="p-0">
                <div className="h-48 overflow-hidden rounded-t-lg bg-gray-50">
                  <img
                    src="/images/Beamex POC8.png"
                    alt="Beamex POC8 for Pharmaceutical"
                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-xl">Pharmaceutical</CardTitle>
                </div>
                <CardDescription className="text-base text-gray-700">
                  Our calibration solutions help pharmaceutical companies maintain
                  precise measurements required for quality control and regulatory
                  compliance.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-600">
              <CardHeader className="p-0">
                <div className="h-48 overflow-hidden rounded-t-lg bg-gray-50">
                  <img
                    src="/images/Beamex ePG.png"
                    alt="Beamex ePG for Power Generation"
                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-xl">Power Generation</CardTitle>
                </div>
                <CardDescription className="text-base text-gray-700">
                  We serve power generation facilities with calibration equipment
                  that ensures efficient operations and compliance with
                  environmental regulations.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
