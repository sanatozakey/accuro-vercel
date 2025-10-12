import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { LoadingSpinner } from './components/LoadingSpinner'
import { ProtectedRoute } from './components/ProtectedRoute'

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home').then(module => ({ default: module.Home })))
const Products = lazy(() => import('./pages/Products').then(module => ({ default: module.Products })))
const About = lazy(() => import('./pages/About').then(module => ({ default: module.About })))
const Contact = lazy(() => import('./pages/Contact').then(module => ({ default: module.Contact })))
const Booking = lazy(() => import('./pages/Booking').then(module => ({ default: module.Booking })))
const BookingDashboard = lazy(() => import('./pages/BookingDashboard').then(module => ({ default: module.BookingDashboard })))
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })))
const Signup = lazy(() => import('./pages/Signup').then(module => ({ default: module.Signup })))

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner size="lg" text="Loading..." />}>
        <Routes>
          <Route
            path="/"
            element={
              <Layout>
                <Home />
              </Layout>
            }
          />
          <Route
            path="/products"
            element={
              <Layout>
                <Products />
              </Layout>
            }
          />
          <Route
            path="/about"
            element={
              <Layout>
                <About />
              </Layout>
            }
          />
          <Route
            path="/contact"
            element={
              <Layout>
                <Contact />
              </Layout>
            }
          />
          <Route
            path="/booking"
            element={
              <Layout>
                <Booking />
              </Layout>
            }
          />
          <Route
            path="/login"
            element={
              <Layout>
                <Login />
              </Layout>
            }
          />
          <Route
            path="/signup"
            element={
              <Layout>
                <Signup />
              </Layout>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <ProtectedRoute adminOnly={true}>
                <BookingDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
