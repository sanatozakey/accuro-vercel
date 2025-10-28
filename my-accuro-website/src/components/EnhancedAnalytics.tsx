import React, { useState, useEffect } from 'react'
import {
  BarChart3,
  Eye,
  ShoppingCart,
  FileText,
  Mail,
  Users,
  Search as SearchIcon,
  TrendingUp,
  Calendar,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
} from 'recharts'
import analyticsService from '../services/analyticsService'
import AnalyticsDetailModal from './AnalyticsDetailModal'

interface EnhancedAnalyticsProps {
  startDate?: string
  endDate?: string
  darkMode?: boolean
}

const EnhancedAnalytics: React.FC<EnhancedAnalyticsProps> = ({ startDate, endDate, darkMode = false }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [productViews, setProductViews] = useState<any[]>([])
  const [cartData, setCartData] = useState<any>(null)
  const [quoteData, setQuoteData] = useState<any>(null)
  const [contactData, setContactData] = useState<any>(null)
  const [registrationData, setRegistrationData] = useState<any>(null)
  const [searchData, setSearchData] = useState<any[]>([])
  const [isSampleData, setIsSampleData] = useState(false)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<any>(null)
  const [modalTitle, setModalTitle] = useState('')
  const [modalFilters, setModalFilters] = useState<any>({})

  useEffect(() => {
    fetchAllAnalytics()
  }, [startDate, endDate])

  const fetchAllAnalytics = async () => {
    setLoading(true)
    setError('')
    try {
      const params = { startDate, endDate }

      const [
        dashboard,
        prodViews,
        cart,
        quotes,
        contacts,
        registrations,
        searches,
      ] = await Promise.all([
        analyticsService.getDashboardAnalytics(params),
        analyticsService.getProductViewsAnalytics(params),
        analyticsService.getCartAnalytics(params),
        analyticsService.getQuoteAnalytics(params),
        analyticsService.getContactAnalytics(params),
        analyticsService.getRegistrationAnalytics(params),
        analyticsService.getSearchAnalytics(params),
      ])

      setDashboardData(dashboard.data)
      setIsSampleData(dashboard.isSampleData || false)
      setProductViews(prodViews.data || [])
      setCartData(cart.data || null)
      setQuoteData(quotes.data || null)
      setContactData(contacts.data || null)
      setRegistrationData(registrations.data || null)
      setSearchData(searches.data || [])
    } catch (error: any) {
      console.error('Failed to load analytics:', error)
      console.error('Error details:', error.response?.data)
      setError(error.response?.data?.message || 'Failed to load analytics. Please check your permissions and try again.')
    } finally {
      setLoading(false)
    }
  }

  const openModal = (type: any, title: string, filters: any = {}) => {
    console.log('EnhancedAnalytics: Opening modal with type:', type)
    console.log('EnhancedAnalytics: Modal title:', title)
    console.log('EnhancedAnalytics: Filters:', filters)
    console.log('EnhancedAnalytics: Date range:', { startDate, endDate })

    setModalType(type)
    setModalTitle(title)
    setModalFilters({ ...filters, startDate, endDate })
    setModalOpen(true)

    console.log('EnhancedAnalytics: Modal state updated to open')
  }

  const MetricCard = ({
    icon: Icon,
    title,
    value,
    color,
    onClick
  }: {
    icon: any;
    title: string;
    value: number | string;
    color: string;
    onClick?: () => void
  }) => {
    const handleClick = () => {
      console.log('MetricCard clicked:', title)
      if (onClick) {
        onClick()
      } else {
        console.log('MetricCard: No onClick handler provided')
      }
    }

    return (
      <div
        onClick={handleClick}
        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>{title}</p>
            <p className={`text-3xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{value}</p>
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-8 w-8 text-white" />
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${darkMode ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-200'} border rounded-lg p-6`}>
        <div className="flex items-start">
          <AlertCircle className={`h-5 w-5 ${darkMode ? 'text-red-400' : 'text-red-500'} mr-3 mt-0.5`} />
          <div className="flex-1">
            <h3 className={`text-lg font-medium ${darkMode ? 'text-red-200' : 'text-red-800'} mb-2`}>Failed to Load Analytics</h3>
            <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-700'} mb-4`}>{error}</p>
            <button
              onClick={fetchAllAnalytics}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sample Data Warning */}
      {isSampleData && (
        <div className={`${darkMode ? 'bg-yellow-900 border-yellow-700' : 'bg-yellow-50 border-yellow-400'} border-l-4 p-4`}>
          <div className="flex">
            <AlertCircle className={`h-5 w-5 ${darkMode ? 'text-yellow-500' : 'text-yellow-400'} mr-3`} />
            <div>
              <p className={`text-sm ${darkMode ? 'text-yellow-200' : 'text-yellow-700'}`}>
                <strong>Sample Data:</strong> The analytics below display sample data for demonstration.
                Once real user interactions occur, this will be replaced with actual data.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics Cards */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            icon={Calendar}
            title="Total Bookings"
            value={dashboardData.totalBookings}
            color="bg-blue-500"
            onClick={() => openModal('bookings', 'All Bookings')}
          />
          <MetricCard
            icon={Users}
            title="Total Users"
            value={dashboardData.totalUsers}
            color="bg-green-500"
            onClick={() => openModal('registrations', 'User Registrations')}
          />
          <MetricCard
            icon={FileText}
            title="Quote Requests"
            value={dashboardData.totalQuotes}
            color="bg-purple-500"
            onClick={() => openModal('quotes', 'Quote Requests')}
          />
          <MetricCard
            icon={Mail}
            title="Contact Forms"
            value={dashboardData.totalContacts}
            color="bg-orange-500"
            onClick={() => openModal('contacts', 'Contact Form Submissions')}
          />
        </div>
      )}

      {/* Product Views Analytics */}
      {productViews && productViews.length > 0 && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Product Views</h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Most viewed products</p>
            </div>
            <button
              onClick={() => openModal('product-views', 'Product View Details')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              View Details
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productViews.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="productName"
                angle={-45}
                textAnchor="end"
                height={120}
                interval={0}
                tick={{ fontSize: 11 }}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" name="Views">
                {productViews.slice(0, 10).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={`hsl(${(index * 30) % 360}, 70%, 50%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Cart Analytics */}
      {cartData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className={`text-xl font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Cart Additions</h2>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Products added to cart</p>
              </div>
              <button
                onClick={() => openModal('cart', 'Cart Addition Details', { eventType: 'cart_add' })}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
              >
                View Details
              </button>
            </div>
            {cartData.additions && cartData.additions.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={cartData.additions.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                  <XAxis dataKey="productName" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }} />
                  <YAxis tick={{ fill: darkMode ? '#9ca3af' : '#6b7280' }} />
                  <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, color: darkMode ? '#f3f4f6' : '#111827' }} />
                  <Bar dataKey="count" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No cart additions yet</p>
            )}
          </div>

          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className={`text-xl font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Cart Removals</h2>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Products removed from cart</p>
              </div>
              <button
                onClick={() => openModal('cart', 'Cart Removal Details', { eventType: 'cart_remove' })}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
              >
                View Details
              </button>
            </div>
            {cartData.removals && cartData.removals.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={cartData.removals.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                  <XAxis dataKey="productName" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }} />
                  <YAxis tick={{ fill: darkMode ? '#9ca3af' : '#6b7280' }} />
                  <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, color: darkMode ? '#f3f4f6' : '#111827' }} />
                  <Bar dataKey="count" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No cart removals yet</p>
            )}
          </div>
        </div>
      )}

      {/* Quote Analytics */}
      {quoteData && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Quote Requests by Status</h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total: {quoteData.total}</p>
            </div>
            <button
              onClick={() => openModal('quotes', 'All Quote Requests')}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              View All
            </button>
          </div>
          {quoteData.byStatus && quoteData.byStatus.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={quoteData.byStatus}
                    dataKey="count"
                    nameKey="_id"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={{ fill: darkMode ? '#e5e7eb' : '#111827' }}
                  >
                    {quoteData.byStatus.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry._id === 'pending'
                            ? '#fbbf24'
                            : entry._id === 'sent'
                            ? '#3b82f6'
                            : entry._id === 'accepted'
                            ? '#10b981'
                            : '#ef4444'
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, color: darkMode ? '#f3f4f6' : '#111827' }} />
                  <Legend wrapperStyle={{ color: darkMode ? '#e5e7eb' : '#111827' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col justify-center space-y-3">
                {quoteData.byStatus.map((item: any, index: number) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} rounded-lg cursor-pointer`}
                    onClick={() => openModal('quotes', `${item._id} Quotes`, { status: item._id })}
                  >
                    <span className={`font-medium capitalize ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{item._id}</span>
                    <span className={`text-xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No quote requests yet</p>
          )}
        </div>
      )}

      {/* Contact Form Analytics */}
      {contactData && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Contact Form Submissions</h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total: {contactData.total}</p>
            </div>
            <button
              onClick={() => openModal('contacts', 'All Contact Submissions')}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
            >
              View All
            </button>
          </div>
          {contactData.byStatus && contactData.byStatus.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {contactData.byStatus.map((item: any, index: number) => (
                <div
                  key={index}
                  className={`p-4 border ${darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:shadow-md'} rounded-lg cursor-pointer transition-shadow`}
                  onClick={() => openModal('contacts', `${item._id} Contacts`, { status: item._id })}
                >
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} capitalize mb-1`}>{item._id}</p>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{item.count}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No contact submissions yet</p>
          )}
        </div>
      )}

      {/* User Registration Analytics */}
      {registrationData && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>User Registrations</h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total: {registrationData.total}</p>
            </div>
            <button
              onClick={() => openModal('registrations', 'All User Registrations')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              View All
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {registrationData.byRole && registrationData.byRole.length > 0 && (
              <div>
                <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>By Role</h3>
                <div className="space-y-2">
                  {registrationData.byRole.map((item: any, index: number) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} rounded-lg cursor-pointer`}
                      onClick={() => openModal('registrations', `${item._id} Users`, { role: item._id })}
                    >
                      <span className={`font-medium capitalize ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{item._id}</span>
                      <span className={`text-xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {registrationData.trend && registrationData.trend.length > 0 && (
              <div>
                <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>Registration Trend</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={registrationData.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis
                      dataKey="_id"
                      tickFormatter={(value) => `${value.month}/${value.year}`}
                      tick={{ fill: darkMode ? '#9ca3af' : '#6b7280' }}
                    />
                    <YAxis tick={{ fill: darkMode ? '#9ca3af' : '#6b7280' }} />
                    <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, color: darkMode ? '#f3f4f6' : '#111827' }} />
                    <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search Analytics */}
      {searchData && searchData.length > 0 && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Popular Search Terms</h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Top {searchData.length} searches</p>
            </div>
            <button
              onClick={() => openModal('searches', 'All Search Queries')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              View All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {searchData.slice(0, 12).map((item: any, index: number) => (
              <div
                key={index}
                className={`p-3 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} rounded-lg flex items-center justify-between cursor-pointer`}
                onClick={() => openModal('searches', `Searches for "${item._id}"`, { searchTerm: item._id })}
              >
                <span className={`text-sm font-medium truncate mr-2 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{item._id}</span>
                <span className={`text-sm font-bold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking Analytics (existing) */}
      {dashboardData && (
        <>
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-4`}>Product Analytics</h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>Most requested products in bookings</p>
            {dashboardData.products && dashboardData.products.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dashboardData.products}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                  <XAxis
                    dataKey="_id"
                    angle={-45}
                    textAnchor="end"
                    height={150}
                    interval={0}
                    tick={{ fontSize: 12, fill: darkMode ? '#9ca3af' : '#6b7280' }}
                  />
                  <YAxis tick={{ fill: darkMode ? '#9ca3af' : '#6b7280' }} />
                  <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, color: darkMode ? '#f3f4f6' : '#111827' }} />
                  <Legend wrapperStyle={{ color: darkMode ? '#e5e7eb' : '#111827' }} />
                  <Bar dataKey="count" fill="#3b82f6" name="Number of Bookings">
                    {dashboardData.products.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${(index * 30) % 360}, 70%, 50%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No product data available</p>
            )}
          </div>

          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'} mb-4`}>Location Analytics</h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>Most selected meeting locations</p>
            {dashboardData.locations && dashboardData.locations.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.locations}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                  <XAxis dataKey="_id" tick={{ fill: darkMode ? '#9ca3af' : '#6b7280' }} />
                  <YAxis tick={{ fill: darkMode ? '#9ca3af' : '#6b7280' }} />
                  <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#ffffff', border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`, color: darkMode ? '#f3f4f6' : '#111827' }} />
                  <Legend wrapperStyle={{ color: darkMode ? '#e5e7eb' : '#111827' }} />
                  <Bar dataKey="count" fill="#10b981" name="Number of Bookings">
                    {dashboardData.locations.map((_: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`hsl(${120 + (index * 30) % 240}, 70%, 50%)`}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No location data available</p>
            )}
          </div>
        </>
      )}

      {/* Analytics Detail Modal */}
      <AnalyticsDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type={modalType}
        title={modalTitle}
        filters={modalFilters}
      />
    </div>
  )
}

export default EnhancedAnalytics
