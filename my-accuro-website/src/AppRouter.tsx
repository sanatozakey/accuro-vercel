import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ScrollToTop } from './components/ScrollToTop'
import { LoadingSpinner } from './components/LoadingSpinner'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ErrorBoundary } from './components/ErrorBoundary'

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home').then(module => ({ default: module.Home })))
const Products = lazy(() => import('./pages/Products').then(module => ({ default: module.Products })))
const ProductDetail = lazy(() => import('./pages/ProductDetail').then(module => ({ default: module.ProductDetail })))
const About = lazy(() => import('./pages/About').then(module => ({ default: module.About })))
const Contact = lazy(() => import('./pages/Contact').then(module => ({ default: module.Contact })))
const Booking = lazy(() => import('./pages/Booking').then(module => ({ default: module.Booking })))
const BookingDashboard = lazy(() => import('./pages/BookingDashboard').then(module => ({ default: module.BookingDashboard })))
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })))
const Signup = lazy(() => import('./pages/Signup').then(module => ({ default: module.Signup })))
const VerifyEmail = lazy(() => import('./pages/VerifyEmail').then(module => ({ default: module.VerifyEmail })))
const Profile = lazy(() => import('./pages/Profile').then(module => ({ default: module.Profile })))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(module => ({ default: module.ForgotPassword })))
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(module => ({ default: module.ResetPassword })))
const Testimonials = lazy(() => import('./pages/Testimonials').then(module => ({ default: module.Testimonials })))
const UserDashboard = lazy(() => import('./pages/UserDashboard').then(module => ({ default: module.UserDashboard })))
const Notifications = lazy(() => import('./pages/Notifications'))
const RecommendationsMonitor = lazy(() => import('./pages/RecommendationsMonitor').then(module => ({ default: module.RecommendationsMonitor })))
const ProductManagement = lazy(() => import('./pages/ProductManagement').then(module => ({ default: module.ProductManagement })))
const QuotationDashboard = lazy(() => import('./pages/QuotationDashboard'))
const CustomerQuotations = lazy(() => import('./pages/CustomerQuotations'))
const RequestQuotation = lazy(() => import('./pages/RequestQuotation'))
const StockSettings = lazy(() => import('./pages/admin/StockSettings'))

// Redirects /account?tab=bookings&bookingId=... to /dashboard?tab=bookings&bookingId=...
function AccountRedirect() {
  const location = useLocation()
  return <Navigate to={`/dashboard${location.search}`} replace />
}

interface AppRouterProps {
  showSplash: boolean;
}

export function AppRouter({ showSplash }: AppRouterProps) {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<LoadingSpinner size="lg" text="Loading..." />}>
        <ErrorBoundary>
        <Routes>
          <Route
            path="/"
            element={
              <Layout showSplash={showSplash}>
                <Home />
              </Layout>
            }
          />
          <Route
            path="/products"
            element={
              <Layout showSplash={showSplash}>
                <Products />
              </Layout>
            }
          />
          <Route
            path="/products/:productId"
            element={
              <Layout showSplash={showSplash}>
                <ProductDetail />
              </Layout>
            }
          />
          <Route
            path="/about"
            element={
              <Layout showSplash={showSplash}>
                <About />
              </Layout>
            }
          />
          <Route
            path="/contact"
            element={
              <Layout showSplash={showSplash}>
                <Contact />
              </Layout>
            }
          />
          <Route
            path="/testimonials"
            element={
              <Layout showSplash={showSplash}>
                <Testimonials />
              </Layout>
            }
          />
          <Route
            path="/booking"
            element={
              <Layout showSplash={showSplash}>
                <Booking />
              </Layout>
            }
          />
          <Route
            path="/quote"
            element={<Navigate to="/products" replace />}
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountRedirect />
              </ProtectedRoute>
            }
          />
          <Route
            path="/login"
            element={
              <Layout showSplash={showSplash}>
                <Login />
              </Layout>
            }
          />
          <Route
            path="/signup"
            element={
              <Layout showSplash={showSplash}>
                <Signup />
              </Layout>
            }
          />
          <Route
            path="/verify-email"
            element={
              <Layout showSplash={showSplash}>
                <VerifyEmail />
              </Layout>
            }
          />
          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />
          <Route
            path="/reset-password"
            element={<ResetPassword />}
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout showSplash={showSplash}>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout showSplash={showSplash}>
                  <UserDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Layout showSplash={showSplash}>
                  <Notifications />
                </Layout>
              </ProtectedRoute>
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
          <Route
            path="/admin/recommendations"
            element={
              <ProtectedRoute adminOnly={true}>
                <RecommendationsMonitor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute adminOnly={true}>
                <ProductManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/quotations"
            element={
              <ProtectedRoute adminOnly={true}>
                <QuotationDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/request-quote"
            element={
              <ProtectedRoute>
                <Layout showSplash={showSplash}>
                  <RequestQuotation />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/quotations"
            element={
              <ProtectedRoute>
                <Layout showSplash={showSplash}>
                  <CustomerQuotations />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/stock-settings"
            element={
              <ProtectedRoute adminOnly={true}>
                <StockSettings />
              </ProtectedRoute>
            }
          />
        </Routes>
        </ErrorBoundary>
      </Suspense>
    </BrowserRouter>
  )
}
