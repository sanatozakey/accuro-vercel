import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MenuIcon, XIcon, User, LogOut, Settings, ShieldCheck, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    setIsUserMenuOpen(false)
    navigate('/login')
  }

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
          <nav className="hidden md:flex space-x-6 items-center">
            <Link
              to="/"
              className="text-gray-700 hover:text-blue-600 text-sm font-medium transition"
            >
              Home
            </Link>
            <Link
              to="/products"
              className="text-gray-700 hover:text-blue-600 text-sm font-medium transition"
            >
              Products
            </Link>
            <Link
              to="/about"
              className="text-gray-700 hover:text-blue-600 text-sm font-medium transition"
            >
              About
            </Link>
            <Link
              to="/testimonials"
              className="text-gray-700 hover:text-blue-600 text-sm font-medium transition"
            >
              Testimonials
            </Link>
            <Link
              to="/contact"
              className="text-gray-700 hover:text-blue-600 text-sm font-medium transition"
            >
              Contact
            </Link>
            <Link
              to="/booking"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md text-sm font-medium transition"
            >
              Book Meeting
            </Link>

            {/* Auth Links */}
            {isAuthenticated ? (
              <div className="relative ml-2">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-3 py-3 rounded-md transition"
                >
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border-2 border-white"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 border-white">
                      <span className="text-xs font-bold text-white">
                        {user?.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700">{user?.name}</span>
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm text-gray-700 font-medium">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      {isAdmin && (
                        <span className="inline-flex items-center mt-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          <ShieldCheck size={12} className="mr-1" />
                          Admin
                        </span>
                      )}
                    </div>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        <User size={16} className="mr-2" />
                        Edit Profile
                      </div>
                    </Link>
                    <Link
                      to="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        <LayoutDashboard size={16} className="mr-2" />
                        My Dashboard
                      </div>
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin/bookings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <Settings size={16} className="mr-2" />
                          Admin Dashboard
                        </div>
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <div className="flex items-center">
                        <LogOut size={16} className="mr-2" />
                        Logout
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex space-x-3 ml-2">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 text-sm font-medium px-3 py-3 transition"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-3 rounded-md transition"
                >
                  Sign Up
                </Link>
              </div>
            )}
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
              to="/testimonials"
              className="block text-gray-800 hover:text-blue-600 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Testimonials
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

            {/* Mobile Auth Links */}
            {isAuthenticated ? (
              <>
                <div className="border-t border-gray-200 pt-3">
                  <p className="text-sm text-gray-700 font-medium px-3">{user?.name}</p>
                  <p className="text-xs text-gray-500 px-3 mb-2">{user?.email}</p>
                </div>
                <Link
                  to="/dashboard"
                  className="block text-gray-800 hover:text-blue-600 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Dashboard
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin/bookings"
                    className="block text-gray-800 hover:text-blue-600 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout()
                    setIsMenuOpen(false)
                  }}
                  className="block w-full text-left text-red-600 hover:text-red-800 font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block text-gray-800 hover:text-blue-600 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="block bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-3 rounded-md transition text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
