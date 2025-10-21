import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import analyticsService from '../services/analyticsService'
import bookingService from '../services/bookingService'

interface AnalyticsDetailModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'bookings' | 'product-views' | 'cart' | 'quotes' | 'contacts' | 'registrations' | 'searches'
  title: string
  filters?: {
    productId?: string
    eventType?: string
    status?: string
    role?: string
    searchTerm?: string
    startDate?: string
    endDate?: string
  }
}

const AnalyticsDetailModal: React.FC<AnalyticsDetailModalProps> = ({
  isOpen,
  onClose,
  type,
  title,
  filters = {},
}) => {
  const [details, setDetails] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (isOpen) {
      fetchDetails()
    }
  }, [isOpen, currentPage, type, filters])

  const fetchDetails = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = {
        ...filters,
        page: currentPage,
        limit: 20,
      }

      console.log('AnalyticsDetailModal: Fetching details for type:', type)
      console.log('AnalyticsDetailModal: Filters:', filters)
      console.log('AnalyticsDetailModal: Params:', params)

      let response
      switch (type) {
        case 'bookings':
          console.log('AnalyticsDetailModal: Fetching bookings from API...')
          const bookingsResponse = await bookingService.getAll(filters)
          console.log('AnalyticsDetailModal: Bookings response:', bookingsResponse)
          response = {
            success: bookingsResponse.success,
            data: bookingsResponse.data || [],
            pagination: {
              total: bookingsResponse.count || 0,
              page: currentPage,
              pages: Math.ceil((bookingsResponse.count || 0) / 20) || 1,
              limit: 20,
            }
          }
          console.log('AnalyticsDetailModal: Processed bookings response:', response)
          break
        case 'product-views':
          response = await analyticsService.getProductViewDetails(params)
          break
        case 'cart':
          response = await analyticsService.getCartDetails(params)
          break
        case 'quotes':
          response = await analyticsService.getQuoteDetails(params)
          break
        case 'contacts':
          response = await analyticsService.getContactDetails(params)
          break
        case 'registrations':
          response = await analyticsService.getRegistrationDetails(params)
          break
        case 'searches':
          response = await analyticsService.getSearchDetails(params)
          break
        default:
          throw new Error('Invalid analytics type')
      }

      if (response.success) {
        console.log('AnalyticsDetailModal: Setting details with', response.data?.length, 'items')
        setDetails(response.data || [])
        if (response.pagination) {
          setTotalPages(response.pagination.pages || 1)
          setTotal(response.pagination.total || 0)
        }
      } else {
        console.error('AnalyticsDetailModal: Response was not successful:', response)
        setError('Failed to load data. Please try again.')
      }
    } catch (err: any) {
      console.error('=== AnalyticsDetailModal Error ===')
      console.error('Type:', type)
      console.error('Filters:', filters)
      console.error('Error:', err)
      console.error('Error response:', err.response)
      console.error('Error response data:', err.response?.data)
      console.error('Error message:', err.message)

      let errorMessage = 'Failed to load details'

      if (err.response?.status === 401) {
        errorMessage = 'You must be logged in as an admin to view bookings'
      } else if (err.response?.status === 403) {
        errorMessage = 'You do not have permission to view this data. Admin access required.'
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const renderTableHeader = () => {
    switch (type) {
      case 'bookings':
        return (
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date & Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Company
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contact
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Product
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Location
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        )
      case 'product-views':
      case 'cart':
      case 'searches':
        return (
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {type === 'searches' ? 'Search Term' : 'Product'}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Event Type
            </th>
          </tr>
        )
      case 'quotes':
        return (
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Company
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total
            </th>
          </tr>
        )
      case 'contacts':
        return (
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Subject
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        )
      case 'registrations':
        return (
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Company
            </th>
          </tr>
        )
      default:
        return null
    }
  }

  const renderTableRow = (item: any, index: number) => {
    switch (type) {
      case 'bookings':
        return (
          <tr key={item._id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {new Date(item.date).toLocaleDateString()}
              <div className="text-xs text-gray-500">{item.time}</div>
            </td>
            <td className="px-6 py-4 text-sm text-gray-900">
              {item.company}
            </td>
            <td className="px-6 py-4 text-sm text-gray-900">
              {item.contactName}
              <div className="text-xs text-gray-500">{item.contactEmail}</div>
            </td>
            <td className="px-6 py-4 text-sm text-gray-900">
              {item.product}
            </td>
            <td className="px-6 py-4 text-sm text-gray-900">
              {item.location}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">
              <span
                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  item.status === 'confirmed'
                    ? 'bg-green-100 text-green-800'
                    : item.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : item.status === 'completed'
                    ? 'bg-blue-100 text-blue-800'
                    : item.status === 'cancelled'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {item.status}
              </span>
            </td>
          </tr>
        )
      case 'product-views':
      case 'cart':
      case 'searches':
        return (
          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {formatDate(item.createdAt)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {item.userName || item.userId?.name || 'Guest'}
              {item.userEmail && (
                <div className="text-xs text-gray-500">{item.userEmail}</div>
              )}
            </td>
            <td className="px-6 py-4 text-sm text-gray-900">
              {type === 'searches' ? item.searchTerm : item.productName || item.productId}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">
              <span
                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  item.eventType === 'product_view'
                    ? 'bg-blue-100 text-blue-800'
                    : item.eventType === 'cart_add'
                    ? 'bg-green-100 text-green-800'
                    : item.eventType === 'cart_remove'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {item.eventType}
              </span>
            </td>
          </tr>
        )
      case 'quotes':
        return (
          <tr key={item._id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {formatDate(item.createdAt)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {item.customerName}
            </td>
            <td className="px-6 py-4 text-sm text-gray-500">{item.customerEmail}</td>
            <td className="px-6 py-4 text-sm text-gray-500">{item.company}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">
              <span
                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  item.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : item.status === 'sent'
                    ? 'bg-blue-100 text-blue-800'
                    : item.status === 'accepted'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {item.status}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              ${item.totalEstimatedPrice?.toLocaleString()}
            </td>
          </tr>
        )
      case 'contacts':
        return (
          <tr key={item._id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {formatDate(item.createdAt)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {item.firstName} {item.lastName}
            </td>
            <td className="px-6 py-4 text-sm text-gray-500">{item.email}</td>
            <td className="px-6 py-4 text-sm text-gray-900">{item.subject}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">
              <span
                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  item.status === 'new'
                    ? 'bg-yellow-100 text-yellow-800'
                    : item.status === 'read'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {item.status}
              </span>
            </td>
          </tr>
        )
      case 'registrations':
        return (
          <tr key={item._id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {formatDate(item.createdAt)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
            <td className="px-6 py-4 text-sm text-gray-500">{item.email}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">
              <span
                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  item.role === 'admin'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {item.role}
              </span>
            </td>
            <td className="px-6 py-4 text-sm text-gray-500">{item.company || '-'}</td>
          </tr>
        )
      default:
        return null
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="mb-4 text-sm text-gray-600">
              Showing {details.length} of {total} total records
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">{renderTableHeader()}</thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {details.length > 0 ? (
                    details.map((item, index) => renderTableRow(item, index))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        No records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 border rounded-md ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 border rounded-md ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default AnalyticsDetailModal
