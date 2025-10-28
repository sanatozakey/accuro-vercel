import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MenuIcon, XIcon, User, LogOut, Settings, ShieldCheck, LayoutDashboard, Sun, Moon, Home, Package, Info, MessageSquare, Mail, Calendar } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet'
import { Separator } from './ui/separator'

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    setIsUserMenuOpen(false)
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-sm transition-colors">
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
              className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium transition"
            >
              Home
            </Link>
            <Link
              to="/products"
              className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium transition"
            >
              Products
            </Link>
            <Link
              to="/about"
              className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium transition"
            >
              About
            </Link>
            <Link
              to="/testimonials"
              className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium transition"
            >
              Testimonials
            </Link>
            <Link
              to="/contact"
              className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium transition"
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
                  className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-3 rounded-md transition"
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
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.name}</span>
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-700 dark:text-gray-200 font-medium">{user?.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                      {isAdmin && (
                        <span className="inline-flex items-center mt-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                          <ShieldCheck size={12} className="mr-1" />
                          Admin
                        </span>
                      )}
                    </div>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        <User size={16} className="mr-2" />
                        Edit Profile
                      </div>
                    </Link>
                    <Link
                      to="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
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
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <Settings size={16} className="mr-2" />
                          Admin Dashboard
                        </div>
                      </Link>
                    )}
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                    <button
                      onClick={() => {
                        toggleTheme()
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-center">
                        {theme === 'light' ? (
                          <>
                            <Moon size={16} className="mr-2" />
                            Dark Mode
                          </>
                        ) : (
                          <>
                            <Sun size={16} className="mr-2" />
                            Light Mode
                          </>
                        )}
                      </div>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
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
          {/* Mobile menu button with Sheet */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <button className="md:hidden text-gray-800 dark:text-gray-200 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition">
                <MenuIcon size={24} />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0 flex flex-col">
              <SheetHeader className="px-6 py-5 bg-gradient-to-r from-blue-600 to-blue-700 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <img
                    src="https://uploadthingy.s3.us-west-1.amazonaws.com/hm7mtaNdbWyZ81qScpSM5S/accuro_logo.png"
                    alt="Accuro Logo"
                    className="h-8 brightness-0 invert"
                  />
                </div>
                {isAuthenticated && user && (
                  <div className="mt-4 flex items-center gap-3">
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white shadow-md">
                        <span className="text-base font-bold text-white">
                          {user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                      <p className="text-xs text-blue-100 truncate">{user.email}</p>
                      {isAdmin && (
                        <span className="inline-flex items-center mt-1 text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                          <ShieldCheck size={10} className="mr-1" />
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </SheetHeader>

              <nav className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="py-4 pb-6">
                  {/* Main Navigation */}
                  <div className="space-y-1 px-3">
                    <Link
                      to="/"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Home size={20} />
                      <span className="font-medium">Home</span>
                    </Link>
                    <Link
                      to="/products"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Package size={20} />
                      <span className="font-medium">Products</span>
                    </Link>
                    <Link
                      to="/about"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Info size={20} />
                      <span className="font-medium">About Us</span>
                    </Link>
                    <Link
                      to="/testimonials"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <MessageSquare size={20} />
                      <span className="font-medium">Testimonials</span>
                    </Link>
                    <Link
                      to="/contact"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Mail size={20} />
                      <span className="font-medium">Contact Us</span>
                    </Link>
                    <Link
                      to="/booking"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Calendar size={20} />
                      <span className="font-medium">Book Meeting</span>
                    </Link>
                  </div>

                  {/* User Dashboard Links */}
                  {isAuthenticated && (
                    <>
                      <Separator className="my-4" />
                      <div className="space-y-1 px-3">
                        <Link
                          to="/profile"
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <User size={20} />
                          <span className="font-medium">My Profile</span>
                        </Link>
                        <Link
                          to="/dashboard"
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <LayoutDashboard size={20} />
                          <span className="font-medium">My Dashboard</span>
                        </Link>
                        {isAdmin && (
                          <Link
                            to="/admin/bookings"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <Settings size={20} />
                            <span className="font-medium">Admin Dashboard</span>
                          </Link>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Bottom Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-3 pb-6 space-y-2">
                  <button
                    onClick={() => {
                      toggleTheme()
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-full"
                  >
                    {theme === 'light' ? (
                      <>
                        <Moon size={20} />
                        <span className="font-medium">Dark Mode</span>
                      </>
                    ) : (
                      <>
                        <Sun size={20} />
                        <span className="font-medium">Light Mode</span>
                      </>
                    )}
                  </button>

                  {isAuthenticated ? (
                    <button
                      onClick={() => {
                        handleLogout()
                        setIsMenuOpen(false)
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full"
                    >
                      <LogOut size={20} />
                      <span className="font-medium">Logout</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <Link
                        to="/login"
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors w-full font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Login
                      </Link>
                      <Link
                        to="/signup"
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors w-full font-medium shadow-md"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Sign Up
                      </Link>
                    </div>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
