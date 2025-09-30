import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { MenuIcon, XIcon } from 'lucide-react'
export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <img
              src="https://uploadthingy.s3.us-west-1.amazonaws.com/hm7mtaNdbWyZ81qScpSM5S/accuro_logo.png"
              alt="Accuro Logo"
              className="h-10"
            />
          </Link>
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link
              to="/"
              className="text-gray-800 hover:text-blue-600 font-medium"
            >
              Home
            </Link>
            <Link
              to="/products"
              className="text-gray-800 hover:text-blue-600 font-medium"
            >
              Products
            </Link>
            <Link
              to="/about"
              className="text-gray-800 hover:text-blue-600 font-medium"
            >
              About Us
            </Link>
            <Link
              to="/contact"
              className="text-gray-800 hover:text-blue-600 font-medium"
            >
              Contact Us
            </Link>
            <Link
              to="/booking"
              className="text-gray-800 hover:text-blue-600 font-medium"
            >
              Book Meeting
            </Link>
          </nav>
          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-800"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 space-y-3">
            <Link
              to="/"
              className="block text-gray-800 hover:text-blue-600 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/products"
              className="block text-gray-800 hover:text-blue-600 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Products
            </Link>
            <Link
              to="/about"
              className="block text-gray-800 hover:text-blue-600 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              About Us
            </Link>
            <Link
              to="/contact"
              className="block text-gray-800 hover:text-blue-600 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact Us
            </Link>
            <Link
              to="/booking"
              className="block text-gray-800 hover:text-blue-600 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Book Meeting
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}
