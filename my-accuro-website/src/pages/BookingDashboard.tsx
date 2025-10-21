import React, { useEffect, useState, useCallback, cloneElement } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import {
  Calendar,
  Clock,
  Building,
  User,
  Mail,
  Phone,
  FileText,
  MapPin,
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  RefreshCw,
  Edit,
  Plus,
  Save,
  CalendarDays,
  List,
  RotateCcw,
  CheckSquare,
  ClipboardList,
  Users,
  BarChart3,
  Trash2,
  Shield,
  Award,
  Star,
  TrendingUp,
  Activity,
  Eye,
  MessageSquare,
  ShoppingCart,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import bookingService from '../services/bookingService'
import userService, { User as UserType } from '../services/userService'
import analyticsService from '../services/analyticsService'
import reviewService, { Review } from '../services/reviewService'
import activityLogService, { ActivityLog } from '../services/activityLogService'
import recommendationAdminService, { RecommendationStats, UserInteraction } from '../services/recommendationAdminService'
import EnhancedAnalytics from '../components/EnhancedAnalytics'
import { SimpleReportsTab } from '../components/SimpleReportsTab'
import { UserHistoryModal } from '../components/UserHistoryModal'
// Define types for our booking data
interface Booking {
  _id: string
  date: string
  time: string
  company: string
  contactName: string
  contactEmail: string
  contactPhone: string
  purpose: string
  location: string
  product: string
  additionalInfo: string
  status: string
  createdAt: string
  isCompleted?: boolean
  conclusion?: string
  rescheduleReason?: string
  originalDate?: string
  originalTime?: string
}
// Define type for new booking without id and createdAt
interface NewBooking {
  date: string
  time: string
  company: string
  contactName: string
  contactEmail: string
  contactPhone: string
  purpose: string
  location: string
  product: string
  additionalInfo: string
  status: string
  isCompleted?: boolean
  conclusion?: string
}
// Define form errors type
interface FormErrors {
  [key: string]: string
}
// Define calendar event type
interface CalendarEvent {
  id: string
  title: string
  start: string
  end?: string
  allDay?: boolean
  backgroundColor?: string
  borderColor?: string
  textColor?: string
  extendedProps?: {
    booking: Booking
  }
}
// Meeting options for dropdowns
const meetingPurposes: string[] = [
  'Product Demonstration',
  'Technical Consultation',
  'Calibration Services',
  'Software Training',
  'Maintenance Support',
  'General Inquiry',
  'Other',
]
const meetingLocations: string[] = [
  'Accuro Office',
  'Client Site',
  'Virtual Meeting',
  'Other',
]
const productCategories: string[] = [
  'Beamex Calibrators',
  'Beamex Calibration Benches',
  'Beamex Calibration Software',
  'Beamex Calibration Accessories',
  'Beamex Pressure Measurement',
  'Beamex Temperature Measurement',
  'Beamex Electrical Measurement',
  'Beamex Integrated Solutions',
  'Not sure / Need recommendation',
]
const statusOptions: string[] = [
  'pending',
  'confirmed',
  'rescheduled',
  'cancelled',
]
export function BookingDashboard(): React.ReactElement {
  const { logout, user: currentUser, isSuperAdmin } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] =
    useState<Booking[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [completionFilter, setCompletionFilter] = useState<string>('all')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false)
  const [isEditMode, setIsEditMode] = useState<boolean>(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false)
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] =
    useState<boolean>(false)
  const [isCompletionModalOpen, setIsCompletionModalOpen] =
    useState<boolean>(false)
  const [rescheduleReason, setRescheduleReason] = useState<string>('')
  const [conclusion, setConclusion] = useState<string>('')
  const [editedBooking, setEditedBooking] = useState<Booking | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'calendar' | 'logs' | 'users' | 'analytics' | 'activityLogs' | 'reviews' | 'reports'>(
    'table',
  )
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])

  // User management state
  const [users, setUsers] = useState<UserType[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([])
  const [userSearchTerm, setUserSearchTerm] = useState<string>('')
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)
  const [userHistoryModalOpen, setUserHistoryModalOpen] = useState(false)
  const [historyUser, setHistoryUser] = useState<UserType | null>(null)
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false)
  const [editedUser, setEditedUser] = useState<UserType | null>(null)

  // Analytics state
  const [productAnalytics, setProductAnalytics] = useState<any[]>([])
  const [locationAnalytics, setLocationAnalytics] = useState<any[]>([])
  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(false)
  const [isSampleData, setIsSampleData] = useState<boolean>(false)

  // Activity Logs state
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [activityLogsLoading, setActivityLogsLoading] = useState<boolean>(false)
  const [activityLogsFilter, setActivityLogsFilter] = useState<{
    action?: string
    resourceType?: string
    productCategory?: string
  }>({})
  const [showProductCategoryFilter, setShowProductCategoryFilter] = useState<boolean>(false)

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(false)
  const [reviewsFilter, setReviewsFilter] = useState<{
    isApproved?: boolean
    rating?: number
  }>({})

  // reports state
  const [reportsStats, setreportsStats] = useState<RecommendationStats | null>(null)
  const [userInteractions, setUserInteractions] = useState<UserInteraction[]>([])
  const [reportsLoading, setreportsLoading] = useState<boolean>(false)

  // Past bookings warning state
  const [pastBookings, setPastBookings] = useState<Booking[]>([])
  const [showPastBookingsWarning, setShowPastBookingsWarning] = useState<boolean>(false)

  const [newBooking, setNewBooking] = useState<NewBooking>({
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    company: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    purpose: '',
    location: '',
    product: '',
    additionalInfo: '',
    status: 'pending',
    isCompleted: false,
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  // Fetch all bookings from backend
  const fetchBookings = async (): Promise<void> => {
    setLoading(true)
    setError('')
    try {
      const response = await bookingService.getAll()
      setBookings(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  // Fetch users from backend
  const fetchUsers = async (): Promise<void> => {
    try {
      const response = await userService.getAll()
      setUsers(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load users')
    }
  }

  // Fetch analytics from backend
  const fetchAnalytics = async (): Promise<void> => {
    setAnalyticsLoading(true)
    try {
      const [productsRes, locationsRes] = await Promise.all([
        analyticsService.getProductAnalytics(),
        analyticsService.getLocationAnalytics(),
      ])
      setProductAnalytics(productsRes.data)
      setLocationAnalytics(locationsRes.data)
      // Set isSampleData flag if either endpoint returns sample data
      setIsSampleData(productsRes.isSampleData || locationsRes.isSampleData || false)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load analytics')
    } finally {
      setAnalyticsLoading(false)
    }
  }

  // Load bookings on component mount
  useEffect(() => {
    fetchBookings()
  }, [])

  // Check for past bookings that need attention
  useEffect(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const overdue = bookings.filter((booking) => {
      if (booking.status === 'completed' || booking.status === 'cancelled') return false

      const bookingDate = new Date(booking.date)
      bookingDate.setHours(0, 0, 0, 0)

      return bookingDate < today
    })

    if (overdue.length > 0) {
      setPastBookings(overdue)
      setShowPastBookingsWarning(true)
    }
  }, [bookings])

  // Load users when users tab is selected
  useEffect(() => {
    if (viewMode === 'users') {
      fetchUsers()
    }
  }, [viewMode])

  // Load analytics when analytics tab is selected
  useEffect(() => {
    if (viewMode === 'analytics') {
      fetchAnalytics()
    }
  }, [viewMode])

  // Fetch activity logs
  const fetchActivityLogs = useCallback(async (): Promise<void> => {
    setActivityLogsLoading(true)
    try {
      const response = await activityLogService.getAllActivityLogs({
        limit: 100,
        ...activityLogsFilter,
      })
      setActivityLogs(response.data || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load activity logs')
    } finally {
      setActivityLogsLoading(false)
    }
  }, [activityLogsFilter])

  // Fetch reviews
  const fetchReviews = useCallback(async (): Promise<void> => {
    setReviewsLoading(true)
    try {
      const response = await reviewService.getAllReviews(
        reviewsFilter.isApproved,
        reviewsFilter.rating
      )
      setReviews(response.data || [])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load reviews')
    } finally {
      setReviewsLoading(false)
    }
  }, [reviewsFilter.isApproved, reviewsFilter.rating])

  const fetchreportsData = async (): Promise<void> => {
    setreportsLoading(true)
    try {
      const [statsResponse, interactionsResponse] = await Promise.all([
        recommendationAdminService.getStats(),
        recommendationAdminService.getAllInteractions(),
      ])
      setreportsStats(statsResponse.data)
      setUserInteractions(interactionsResponse.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load reports data')
    } finally {
      setreportsLoading(false)
    }
  }

  // Initialize product category filter visibility based on resource type
  useEffect(() => {
    setShowProductCategoryFilter(activityLogsFilter.resourceType === 'booking');
  }, [activityLogsFilter.resourceType]);

  // Load activity logs when tab is selected
  useEffect(() => {
    if (viewMode === 'activityLogs') {
      fetchActivityLogs()
    }
  }, [viewMode, activityLogsFilter, fetchActivityLogs])

  // Load reviews when tab is selected
  useEffect(() => {
    if (viewMode === 'reviews') {
      fetchReviews()
    }
  }, [viewMode, reviewsFilter, fetchReviews])

  // Load reports when tab is selected - DISABLED (ReportsTab handles its own data loading now)
  // useEffect(() => {
  //   if (viewMode === 'reports') {
  //     fetchreportsData()
  //   }
  // }, [viewMode])

  // Filter users based on search
  useEffect(() => {
    let result = users
    if (userSearchTerm) {
      result = result.filter(
        (user) =>
          user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
          (user.company && user.company.toLowerCase().includes(userSearchTerm.toLowerCase()))
      )
    }
    setFilteredUsers(result)
  }, [userSearchTerm, users])
  // Create calendar events from filteredBookings (so filters work in calendar view)
  // Exclude completed bookings from calendar view
  useEffect(() => {
    const events: CalendarEvent[] = []

    filteredBookings.forEach((booking) => {
      // Skip completed bookings - they should not appear on the calendar
      if (booking.status === 'completed') return
      if (!booking.date || !booking.time) return

      try {
        // Handle different date formats from MongoDB
        let dateStr = booking.date
        if (booking.date instanceof Date) {
          dateStr = booking.date.toISOString()
        }

        // Extract just the date part (YYYY-MM-DD) from ISO string if needed
        const datePart = dateStr.split('T')[0]

        // Parse the clean date string
        const [year, month, day] = datePart.split('-').map(Number)
        const [hours, minutes] = booking.time.split(':').map(Number)

        // Validate parsed values
        if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes)) {
          return
        }

        // Create date in local timezone (month is 0-indexed in JavaScript)
        const startDate = new Date(year, month - 1, day, hours, minutes, 0)

        if (isNaN(startDate.getTime())) return

        // Create end time (1 hour later)
        const endDate = new Date(startDate)
        endDate.setHours(endDate.getHours() + 1)

        // Determine color based on status
        let backgroundColor = '#3788d8'
        if (booking.status === 'confirmed') backgroundColor = '#10b981'
        if (booking.status === 'cancelled') backgroundColor = '#ef4444'
        if (booking.status === 'pending') backgroundColor = '#f59e0b'
        if (booking.status === 'rescheduled') backgroundColor = '#8b5cf6'

        const event: CalendarEvent = {
          id: booking._id,
          title: `${booking.company} - ${booking.purpose}`,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          backgroundColor,
          borderColor: backgroundColor,
          textColor: '#ffffff',
          extendedProps: {
            booking,
          },
        }

        events.push(event)
      } catch (error) {
        // Silently skip invalid bookings
      }
    })

    setCalendarEvents(events)
  }, [filteredBookings])
  // Handle search and filtering
  useEffect(() => {
    let result = bookings
    // Apply search term filter
    if (searchTerm) {
      result = result.filter(
        (booking) =>
          booking.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.contactName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          booking._id.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter((booking) => booking.status === statusFilter)
    }
    // Apply completion filter
    if (completionFilter !== 'all') {
      result = result.filter((booking) =>
        completionFilter === 'completed'
          ? booking.isCompleted
          : !booking.isCompleted,
      )
    }
    setFilteredBookings(result)
  }, [searchTerm, statusFilter, completionFilter, bookings])
  // Handle status change
  const updateBookingStatus = async (id: string, newStatus: string): Promise<void> => {
    try {
      await bookingService.update(id, { status: newStatus })
      // Update local state
      const updatedBookings = bookings.map((booking) => {
        if (booking._id === id) {
          return {
            ...booking,
            status: newStatus,
          }
        }
        return booking
      })
      setBookings(updatedBookings)
      // Close detail modal if open
      if (isDetailModalOpen && selectedBooking && selectedBooking._id === id) {
        setSelectedBooking({
          ...selectedBooking,
          status: newStatus,
        })
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update booking status')
    }
  }
  // Handle completion status change
  const markBookingAsCompleted = async (id: string, conclusion: string): Promise<void> => {
    try {
      await bookingService.update(id, {
        status: 'completed',
        conclusion,
        canReview: true
      })
      // Refresh bookings from server
      await fetchBookings()
      setIsCompletionModalOpen(false)
      setIsDetailModalOpen(false)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to mark booking as completed')
    }
  }
  // Handle reschedule
  const rescheduleBooking = async (): Promise<void> => {
    if (!editedBooking) return
    try {
      await bookingService.update(editedBooking._id, {
        date: editedBooking.date,
        time: editedBooking.time,
        status: 'rescheduled',
        originalDate: selectedBooking?.originalDate || selectedBooking?.date || '',
        originalTime: selectedBooking?.originalTime || selectedBooking?.time || '',
        rescheduleReason,
      })
      // Refresh bookings from server
      await fetchBookings()
      setIsRescheduleModalOpen(false)
      setIsDetailModalOpen(false)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reschedule booking')
    }
  }
  // View booking details
  const viewBookingDetails = (booking: Booking): void => {
    setSelectedBooking(booking)
    setEditedBooking({
      ...booking,
    })
    setIsEditMode(false)
    setIsDetailModalOpen(true)
  }
  // Open reschedule modal
  const openRescheduleModal = (): void => {
    if (selectedBooking) {
      setRescheduleReason('')
      setIsRescheduleModalOpen(true)
    }
  }
  // Open completion modal
  const openCompletionModal = (): void => {
    if (selectedBooking) {
      setConclusion(selectedBooking.conclusion || '')
      setIsCompletionModalOpen(true)
    }
  }

  // Handle past bookings - mark all as complete
  const markAllPastAsCompleted = async (): Promise<void> => {
    try {
      for (const booking of pastBookings) {
        await bookingService.update(booking._id, {
          status: 'completed',
          conclusion: 'Automatically completed - past booking',
          canReview: true
        })
      }
      await fetchBookings()
      setShowPastBookingsWarning(false)
      setPastBookings([])
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to mark bookings as completed')
    }
  }

  // Handle past bookings - dismiss warning
  const dismissPastBookingsWarning = (): void => {
    setShowPastBookingsWarning(false)
  }

  // Toggle edit mode
  const toggleEditMode = (): void => {
    if (isEditMode && selectedBooking) {
      // Exiting edit mode without saving
      setEditedBooking({
        ...selectedBooking,
      })
    }
    setIsEditMode(!isEditMode)
  }
  // Handle edit changes
  const handleEditChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ): void => {
    const { name, value } = e.target
    if (editedBooking) {
      setEditedBooking({
        ...editedBooking,
        [name]: value,
      })
    }
  }
  // Save edited booking
  const saveEditedBooking = async (): Promise<void> => {
    if (!editedBooking) return
    // Validate form
    const errors = validateBookingForm(editedBooking)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    // Clear any previous errors
    setFormErrors({})
    try {
      await bookingService.update(editedBooking._id, editedBooking)
      // Refresh bookings from server
      await fetchBookings()
      setIsEditMode(false)
      setIsDetailModalOpen(false)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update booking')
    }
  }
  // Delete booking
  const deleteBooking = async (id: string): Promise<void> => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        await bookingService.delete(id)
        // Refresh bookings from server
        await fetchBookings()
        if (isDetailModalOpen) {
          setIsDetailModalOpen(false)
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete booking')
      }
    }
  }
  // Open create booking modal
  const openCreateModal = (): void => {
    setNewBooking({
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
      company: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      purpose: '',
      location: '',
      product: '',
      additionalInfo: '',
      status: 'pending',
      isCompleted: false,
    })
    setFormErrors({})
    setIsCreateModalOpen(true)
  }
  // Handle new booking changes
  const handleNewBookingChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ): void => {
    const { name, value } = e.target
    setNewBooking({
      ...newBooking,
      [name]: value,
    })
  }
  // Create new booking
  const createNewBooking = async (): Promise<void> => {
    // Validate form
    const errors = validateBookingForm(newBooking)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    // Clear any previous errors
    setFormErrors({})
    try {
      await bookingService.create(newBooking)
      // Refresh bookings from server
      await fetchBookings()
      setIsCreateModalOpen(false)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create booking')
    }
  }
  // Handle calendar event click
  const handleEventClick = (info: any): void => {
    const booking = info.event.extendedProps.booking
    viewBookingDetails(booking)
  }
  // Validate booking form
  const validateBookingForm = (booking: Booking | NewBooking): FormErrors => {
    const errors: FormErrors = {}
    if (!booking.company) errors.company = 'Company name is required'
    if (!booking.contactName) errors.contactName = 'Contact name is required'
    if (!booking.contactEmail) {
      errors.contactEmail = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(booking.contactEmail)) {
      errors.contactEmail = 'Email is invalid'
    }
    if (!booking.contactPhone) errors.contactPhone = 'Phone number is required'
    if (!booking.date) errors.date = 'Date is required'
    if (!booking.time) errors.time = 'Time is required'
    if (!booking.purpose) errors.purpose = 'Purpose is required'
    if (!booking.location) errors.location = 'Location is required'
    if (!booking.product) errors.product = 'Product is required'
    return errors
  }
  // Get status badge
  const getStatusBadge = (status: string): React.ReactElement => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Confirmed
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </span>
        )
      case 'rescheduled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <RotateCcw className="w-3 h-3 mr-1" />
            Rescheduled
          </span>
        )
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckSquare className="w-3 h-3 mr-1" />
            Completed
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Unknown
          </span>
        )
    }
  }
  // Get completion badge
  const getCompletionBadge = (
    isCompleted: boolean | undefined,
  ): React.ReactElement => {
    if (isCompleted) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <CheckSquare className="w-3 h-3 mr-1" />
          Completed
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <ClipboardList className="w-3 h-3 mr-1" />
        Pending
      </span>
    )
  }
  // Format date for display (currently unused but available for future use)
  // const formatDate = (dateString: string): string => {
  //   const options: Intl.DateTimeFormatOptions = {
  //     year: 'numeric',
  //     month: 'long',
  //     day: 'numeric',
  //   }
  //   return new Date(dateString).toLocaleDateString(undefined, options)
  // }
  // User management functions
  const deleteUserHandler = async (id: string, userName: string): Promise<void> => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
      try {
        await userService.delete(id)
        await fetchUsers()
        setError('')
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete user')
      }
    }
  }

  const updateUserRole = async (userId: string, newRole: 'user' | 'admin' | 'superadmin'): Promise<void> => {
    try {
      await userService.changeRole(userId, newRole)
      await fetchUsers()
      setError('')
      setIsUserModalOpen(false)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user role')
    }
  }

  const openUserModal = (user: UserType): void => {
    setSelectedUser(user)
    setEditedUser({ ...user })
    setIsUserModalOpen(true)
  }

  const openUserHistoryModal = (user: UserType): void => {
    setHistoryUser(user)
    setUserHistoryModalOpen(true)
  }

  // Review management handlers
  const handleApproveReview = async (id: string, isApproved: boolean): Promise<void> => {
    try {
      await reviewService.approveReview(id, isApproved)
      await fetchReviews()
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update review')
    }
  }

  const handleDeleteReview = async (id: string, userName: string): Promise<void> => {
    if (window.confirm(`Are you sure you want to delete the review from "${userName}"?`)) {
      try {
        await reviewService.deleteReview(id)
        await fetchReviews()
        setError('')
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete review')
      }
    }
  }

  // Render form field with error message
  const renderFormField = (
    label: string,
    name: string,
    type: string,
    value: string,
    onChange: (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => void,
    options: string[] | null = null,
    icon: React.ReactElement | null = null,
  ): React.ReactElement => {
    return (
      <div>
        <label
          htmlFor={name}
          className="flex items-center text-sm font-medium text-gray-700 mb-1"
        >
          {icon &&
           cloneElement(icon, {
  className: 'h-4 w-4 text-gray-400 mr-2',
} as any)}
          {label}
        </label>
        {type === 'select' && options ? (
          <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            className={`w-full px-3 py-2 border ${formErrors[name] ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
          >
            <option value="">Select {label.toLowerCase()}</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            rows={4}
            className={`w-full px-3 py-2 border ${formErrors[name] ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
          ></textarea>
        ) : (
          <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            className={`w-full px-3 py-2 border ${formErrors[name] ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
          />
        )}
        {formErrors[name] && (
          <p className="mt-1 text-sm text-red-600">{formErrors[name]}</p>
        )}
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <img
                src="https://uploadthingy.s3.us-west-1.amazonaws.com/hm7mtaNdbWyZ81qScpSM5S/accuro_logo.png"
                alt="Accuro Logo"
                className="h-10 mr-4"
              />
              <h1 className="text-2xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to Website
              </a>
              <button
                onClick={logout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError('')}
              className="text-red-700 hover:text-red-900"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        )}
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading bookings...</p>
            </div>
          </div>
        )}
        {!loading && (
          <>
        {/* View Toggles */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center px-4 py-2 border ${viewMode === 'table' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'} text-sm font-medium rounded-md`}
            >
              <List className="h-4 w-4 mr-2" />
              List View
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`inline-flex items-center px-4 py-2 border ${viewMode === 'calendar' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'} text-sm font-medium rounded-md`}
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              Calendar View
            </button>
            <button
              onClick={() => setViewMode('logs')}
              className={`inline-flex items-center px-4 py-2 border ${viewMode === 'logs' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'} text-sm font-medium rounded-md`}
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              Transaction Logs
            </button>
            <button
              onClick={() => setViewMode('activityLogs')}
              className={`inline-flex items-center px-4 py-2 border ${viewMode === 'activityLogs' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'} text-sm font-medium rounded-md`}
            >
              <Shield className="h-4 w-4 mr-2" />
              Activity Logs
            </button>
            <button
              onClick={() => setViewMode('reviews')}
              className={`inline-flex items-center px-4 py-2 border ${viewMode === 'reviews' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'} text-sm font-medium rounded-md`}
            >
              <Award className="h-4 w-4 mr-2" />
              Reviews
            </button>
            <button
              onClick={() => setViewMode('users')}
              className={`inline-flex items-center px-4 py-2 border ${viewMode === 'users' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'} text-sm font-medium rounded-md`}
            >
              <Users className="h-4 w-4 mr-2" />
              Users
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`inline-flex items-center px-4 py-2 border ${viewMode === 'analytics' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'} text-sm font-medium rounded-md`}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </button>
            <button
              onClick={() => setViewMode('reports')}
              className={`inline-flex items-center px-4 py-2 border ${viewMode === 'reports' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'} text-sm font-medium rounded-md`}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Reports
            </button>
          </div>
        </div>
        {/* Filters and Actions - Only show for booking-related views */}
        {(viewMode === 'table' || viewMode === 'calendar' || viewMode === 'logs') && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-4 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search by company or contact"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="md:col-span-3">
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="rescheduled">Rescheduled</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              {viewMode === 'logs' && (
                <div className="md:col-span-3">
                  <select
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={completionFilter}
                    onChange={(e) => setCompletionFilter(e.target.value)}
                  >
                    <option value="all">All Meetings</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending Completion</option>
                  </select>
                </div>
              )}
              <div className={`${viewMode === 'logs' ? 'md:col-span-2' : 'md:col-span-5'} flex space-x-2 justify-end`}>
                <button
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  onClick={fetchBookings}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </button>
                <button
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  onClick={openCreateModal}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Booking
                </button>
              </div>
            </div>
          </div>
        )}
        {viewMode === 'table' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      ID
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Date & Time
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Company
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Contact
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Purpose
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBookings.length > 0 ? (
                    filteredBookings.map((booking) => (
                      <tr key={booking._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {booking._id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                            {new Date(booking.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center mt-1">
                            <Clock className="h-4 w-4 text-gray-400 mr-1" />
                            {booking.time}
                          </div>
                          {booking.status === 'rescheduled' && (
                            <div className="text-xs text-gray-400 mt-1 italic">
                              Originally:{' '}
                              {new Date(
                                booking.originalDate || '',
                              ).toLocaleDateString()}{' '}
                              at {booking.originalTime}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="font-medium">{booking.company}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{booking.contactName}</div>
                          <div className="text-xs text-gray-400">
                            {booking.contactEmail}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {booking.purpose}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getStatusBadge(booking.status)}
                          {booking.isCompleted !== undefined && (
                            <div className="mt-1">
                              {getCompletionBadge(booking.isCompleted)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => viewBookingDetails(booking)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View
                            </button>
                            <button
                              onClick={() => {
                                setSelectedBooking(booking)
                                setEditedBooking({
                                  ...booking,
                                })
                                setIsEditMode(true)
                                setIsDetailModalOpen(true)
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteBooking(booking._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        No bookings found matching your criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {viewMode === 'calendar' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              events={calendarEvents}
              eventClick={handleEventClick}
              height="auto"
              contentHeight={600}
              dayMaxEventRows={3}
              moreLinkClick="popover"
              eventDisplay="block"
              displayEventTime={true}
              displayEventEnd={false}
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }}
              eventContent={(arg) => {
                return (
                  <div className="p-1 overflow-hidden text-ellipsis whitespace-nowrap">
                    <div className="font-medium text-xs">
                      {arg.timeText && <span className="mr-1">{arg.timeText}</span>}
                    </div>
                    <div className="text-xs truncate">
                      {arg.event.title}
                    </div>
                  </div>
                )
              }}
            />
          </div>
        )}
        {viewMode === 'logs' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      ID
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Date & Time
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Company
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Completion
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Conclusion / Notes
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBookings.length > 0 ? (
                    filteredBookings.map((booking) => (
                      <tr key={booking._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {booking._id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                            {new Date(booking.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center mt-1">
                            <Clock className="h-4 w-4 text-gray-400 mr-1" />
                            {booking.time}
                          </div>
                          {booking.status === 'rescheduled' && (
                            <div className="text-xs text-gray-400 mt-1 italic">
                              Originally:{' '}
                              {new Date(
                                booking.originalDate || '',
                              ).toLocaleDateString()}{' '}
                              at {booking.originalTime}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="font-medium">{booking.company}</div>
                          <div className="text-xs text-gray-400">
                            {booking.contactName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getStatusBadge(booking.status)}
                          {booking.status === 'rescheduled' &&
                            booking.rescheduleReason && (
                              <div className="mt-1 text-xs text-gray-500 max-w-xs">
                                <span className="font-medium">Reason:</span>{' '}
                                {booking.rescheduleReason}
                              </div>
                            )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getCompletionBadge(booking.isCompleted)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-md">
                          {booking.conclusion ? (
                            <div className="line-clamp-2">
                              {booking.conclusion}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">
                              No conclusion recorded
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => viewBookingDetails(booking)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        No meeting logs found matching your criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {viewMode === 'users' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search users by name, email, or company"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {user.profilePicture ? (
                              <img
                                src={user.profilePicture}
                                alt={user.name}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                <span className="text-sm font-bold text-white">
                                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                                </span>
                              </div>
                            )}
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.company || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.phone || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.role === 'superadmin' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <Shield className="w-3 h-3 mr-1" />
                              Super Admin
                            </span>
                          ) : user.role === 'admin' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              <Shield className="w-3 h-3 mr-1" />
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              User
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.isEmailVerified ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Unverified
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openUserHistoryModal(user)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View user history"
                            >
                              History
                            </button>
                            <button
                              onClick={() => openUserModal(user)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteUserHandler(user._id, user.name)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                        No users found matching your criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {viewMode === 'analytics' && (
          <EnhancedAnalytics />
        )}

        {/* Activity Logs View */}
        {viewMode === 'activityLogs' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {activityLogsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Loading activity logs...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Filter Section */}
                <div className="p-4 border-b bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Resource Type
                      </label>
                      <select
                        className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                        value={activityLogsFilter.resourceType || ''}
                        onChange={(e) => {
                          const newResourceType = e.target.value || undefined;
                          setShowProductCategoryFilter(newResourceType === 'booking');
                          setActivityLogsFilter({
                            action: activityLogsFilter.action,
                            resourceType: newResourceType,
                            productCategory: newResourceType === 'booking' ? activityLogsFilter.productCategory : undefined
                          });
                        }}
                      >
                        <option value="">All Types</option>
                        <option value="user">User</option>
                        <option value="booking">Booking</option>
                        <option value="review">Review</option>
                        <option value="auth">Authentication</option>
                        <option value="system">System</option>
                      </select>
                    </div>
                    {showProductCategoryFilter && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Product Category
                        </label>
                        <select
                          className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                          value={activityLogsFilter.productCategory || ''}
                          onChange={(e) => setActivityLogsFilter({
                            ...activityLogsFilter,
                            productCategory: e.target.value || undefined
                          })}
                        >
                          <option value="">All Products</option>
                          <option value="Beamex Calibrators">Beamex Calibrators</option>
                          <option value="Beamex Calibration Benches">Beamex Calibration Benches</option>
                          <option value="Beamex Calibration Software">Beamex Calibration Software</option>
                          <option value="Beamex Calibration Accessories">Beamex Calibration Accessories</option>
                          <option value="Beamex Pressure Measurement">Beamex Pressure Measurement</option>
                          <option value="Beamex Temperature Measurement">Beamex Temperature Measurement</option>
                          <option value="Beamex Electrical Measurement">Beamex Electrical Measurement</option>
                          <option value="Beamex Integrated Solutions">Beamex Integrated Solutions</option>
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Action
                      </label>
                      <input
                        type="text"
                        className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                        placeholder="Filter by action (e.g. LOGIN, USER_CREATED)"
                        value={activityLogsFilter.action || ''}
                        onChange={(e) => setActivityLogsFilter({
                          ...activityLogsFilter,
                          action: e.target.value || undefined
                        })}
                      />
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Resource
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          IP Address
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {activityLogs.length > 0 ? (
                        activityLogs.map((log) => (
                          <tr key={log._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div>{log.userName}</div>
                              <div className="text-xs text-gray-500">{log.userEmail}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {log.action}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {log.resourceType}
                              </span>
                              {log.resourceId && (
                                <div className="text-xs text-gray-400 mt-1">
                                  ID: {log.resourceId.substring(0, 8)}...
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-md">
                              {log.details || <span className="text-gray-400 italic">No details</span>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {log.ipAddress || '-'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                            No activity logs found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* Reviews Management View */}
        {viewMode === 'reviews' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {reviewsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Loading reviews...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Filter Section */}
                <div className="p-4 border-b bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Approval Status
                      </label>
                      <select
                        className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                        value={reviewsFilter.isApproved === undefined ? '' : reviewsFilter.isApproved.toString()}
                        onChange={(e) => setReviewsFilter({
                          ...reviewsFilter,
                          isApproved: e.target.value === '' ? undefined : e.target.value === 'true'
                        })}
                      >
                        <option value="">All Reviews</option>
                        <option value="true">Approved</option>
                        <option value="false">Pending Approval</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rating
                      </label>
                      <select
                        className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                        value={reviewsFilter.rating || ''}
                        onChange={(e) => setReviewsFilter({
                          ...reviewsFilter,
                          rating: e.target.value ? parseInt(e.target.value) : undefined
                        })}
                      >
                        <option value="">All Ratings</option>
                        <option value="5">5 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="2">2 Stars</option>
                        <option value="1">1 Star</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Reviews Grid */}
                <div className="p-6">
                  {reviews.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                      {reviews.map((review) => (
                        <div key={review._id} className="border rounded-lg p-6 hover:shadow-md transition">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-5 w-5 ${
                                      star <= review.rating
                                        ? 'text-yellow-400 fill-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <h3 className="font-semibold text-gray-900">{review.userName}</h3>
                              {review.company && (
                                <p className="text-sm text-gray-600">{review.company}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(review.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {review.isApproved ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Approved
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Pending
                                </span>
                              )}
                              {review.isPublic ? (
                                <span className="text-xs text-gray-500">Public</span>
                              ) : (
                                <span className="text-xs text-gray-500">Private</span>
                              )}
                            </div>
                          </div>

                          {/* Comment */}
                          <p className="text-gray-700 mb-4 leading-relaxed">
                            "{review.comment}"
                          </p>

                          {/* Actions */}
                          <div className="flex items-center gap-2 pt-4 border-t">
                            {!review.isApproved && (
                              <button
                                onClick={() => handleApproveReview(review._id, true)}
                                className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </button>
                            )}
                            {review.isApproved && (
                              <button
                                onClick={() => handleApproveReview(review._id, false)}
                                className="inline-flex items-center px-3 py-1.5 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700 transition"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Unapprove
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteReview(review._id, review.userName)}
                              className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No reviews found matching your criteria</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* OLD reports View - DISABLED */}
            {false && viewMode === 'reports_old' && (
              <>
                {reportsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mr-3" />
                    <p className="text-gray-600">Loading recommendation data...</p>
                  </div>
                ) : reportsStats ? (
                  <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                      <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Total Interactions</p>
                            <p className="text-3xl font-bold text-gray-900">{reportsStats.totalInteractions}</p>
                          </div>
                          <Activity className="h-12 w-12 text-blue-600" />
                        </div>
                      </div>

                      <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Active Users</p>
                            <p className="text-3xl font-bold text-gray-900">{reportsStats.totalUsers}</p>
                          </div>
                          <Users className="h-12 w-12 text-green-600" />
                        </div>
                      </div>

                      <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Top Products</p>
                            <p className="text-3xl font-bold text-gray-900">{reportsStats.topProducts.length}</p>
                          </div>
                          <Star className="h-12 w-12 text-yellow-600" />
                        </div>
                      </div>

                      <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Categories</p>
                            <p className="text-3xl font-bold text-gray-900">
                              {reportsStats.interactionsByCategory.length}
                            </p>
                          </div>
                          <Package className="h-12 w-12 text-purple-600" />
                        </div>
                      </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                      {/* Interaction Types Pie Chart */}
                      <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Interactions by Type</h3>
                        {reportsStats.interactionsByType.length > 0 ? (
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={reportsStats.interactionsByType.map((item) => ({
                                  name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
                                  value: item.count,
                                }))}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) =>
                                  `${name}: ${(percent * 100).toFixed(0)}%`
                                }
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {reportsStats.interactionsByType.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-center text-gray-500 py-12">No interaction data yet</p>
                        )}
                      </div>

                      {/* Category Interactions Bar Chart */}
                      <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                          Interactions by Category
                        </h3>
                        {reportsStats.interactionsByCategory.length > 0 ? (
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={reportsStats.interactionsByCategory.slice(0, 6).map((item) => ({
                              name: item._id,
                              interactions: item.count,
                            }))}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="interactions" fill="#3B82F6" />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-center text-gray-500 py-12">No category data yet</p>
                        )}
                      </div>
                    </div>

                    {/* Top Products Table */}
                    <div className="bg-white rounded-lg shadow-md mb-8">
                      <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center">
                          <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                          Top Products by Engagement
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Rank
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Product
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Interactions
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total Weight
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {reportsStats.topProducts.length > 0 ? (
                              reportsStats.topProducts.map((product, index) => (
                                <tr key={product.productId} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-lg font-bold text-gray-900">#{index + 1}</span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-medium text-gray-900">{product.productName}</div>
                                    <div className="text-sm text-gray-500">{product.productId}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm text-gray-900">
                                      {product.interactionCount}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm font-medium text-blue-600">
                                      {product.totalWeight}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                  No product data yet
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Recent Interactions */}
                    <div className="bg-white rounded-lg shadow-md">
                      <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center">
                          <Clock className="h-5 w-5 mr-2 text-blue-600" />
                          Recent Interactions
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                User
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Product
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Category
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Weight
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Time
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {userInteractions.length > 0 ? (
                              userInteractions.slice(0, 20).map((interaction) => {
                                const getInteractionIcon = (type: string) => {
                                  switch (type) {
                                    case 'view':
                                      return <Eye className="h-4 w-4 text-blue-600" />;
                                    case 'booking':
                                      return <Calendar className="h-4 w-4 text-green-600" />;
                                    case 'inquiry':
                                      return <MessageSquare className="h-4 w-4 text-yellow-600" />;
                                    case 'purchase':
                                      return <ShoppingCart className="h-4 w-4 text-purple-600" />;
                                    default:
                                      return <Activity className="h-4 w-4 text-gray-600" />;
                                  }
                                };

                                const getInteractionBadgeColor = (type: string) => {
                                  switch (type) {
                                    case 'view':
                                      return 'bg-blue-100 text-blue-800';
                                    case 'booking':
                                      return 'bg-green-100 text-green-800';
                                    case 'inquiry':
                                      return 'bg-yellow-100 text-yellow-800';
                                    case 'purchase':
                                      return 'bg-purple-100 text-purple-800';
                                    default:
                                      return 'bg-gray-100 text-gray-800';
                                  }
                                };

                                return (
                                  <tr key={interaction._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900">
                                        {interaction.userId?.name || 'Unknown'}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {interaction.userId?.email || 'N/A'}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getInteractionBadgeColor(
                                          interaction.interactionType
                                        )}`}
                                      >
                                        {getInteractionIcon(interaction.interactionType)}
                                        {interaction.interactionType}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      {interaction.productId}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {interaction.productCategory}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className="text-sm font-medium text-blue-600">
                                        {interaction.weight}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {new Date(interaction.createdAt).toLocaleString()}
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                  No interactions recorded yet
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Activity className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No recommendation data available</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Reports View */}
        {viewMode === 'reports' && (
          <SimpleReportsTab />
        )}
          </>
        )}
      </div>
      {/* Booking Detail/Edit Modal */}
      {isDetailModalOpen && selectedBooking && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {isEditMode ? 'Edit Booking' : 'Booking Details'}{' '}
                        {selectedBooking._id}
                      </h3>
                      <div className="flex space-x-2">
                        {!isEditMode && (
                          <button
                            type="button"
                            onClick={toggleEditMode}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                          >
                            <Edit className="h-3.5 w-3.5 mr-1" />
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="border-t border-gray-200 py-3">
                      {isEditMode && editedBooking ? (
                        <div className="grid grid-cols-1 gap-y-4">
                          <div className="flex items-center">
                            <Building className="h-5 w-5 text-gray-400 mr-2" />
                            <div className="text-sm font-medium text-gray-500">
                              ID: {editedBooking._id}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderFormField(
                              'Date',
                              'date',
                              'date',
                              editedBooking.date,
                              handleEditChange,
                              null,
                              <Calendar />,
                            )}
                            {renderFormField(
                              'Time',
                              'time',
                              'time',
                              editedBooking.time,
                              handleEditChange,
                              null,
                              <Clock />,
                            )}
                          </div>
                          {renderFormField(
                            'Company',
                            'company',
                            'text',
                            editedBooking.company,
                            handleEditChange,
                            null,
                            <Building />,
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderFormField(
                              'Contact Name',
                              'contactName',
                              'text',
                              editedBooking.contactName,
                              handleEditChange,
                              null,
                              <User />,
                            )}
                            {renderFormField(
                              'Email',
                              'contactEmail',
                              'email',
                              editedBooking.contactEmail,
                              handleEditChange,
                              null,
                              <Mail />,
                            )}
                          </div>
                          {renderFormField(
                            'Phone',
                            'contactPhone',
                            'tel',
                            editedBooking.contactPhone,
                            handleEditChange,
                            null,
                            <Phone />,
                          )}
                          {renderFormField(
                            'Purpose',
                            'purpose',
                            'select',
                            editedBooking.purpose,
                            handleEditChange,
                            meetingPurposes,
                            <FileText />,
                          )}
                          {renderFormField(
                            'Location',
                            'location',
                            'select',
                            editedBooking.location,
                            handleEditChange,
                            meetingLocations,
                            <MapPin />,
                          )}
                          {renderFormField(
                            'Product/Service',
                            'product',
                            'select',
                            editedBooking.product,
                            handleEditChange,
                            productCategories,
                            <Package />,
                          )}
                          {renderFormField(
                            'Additional Information',
                            'additionalInfo',
                            'textarea',
                            editedBooking.additionalInfo,
                            handleEditChange,
                          )}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Status
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              {statusOptions.map((status) => (
                                <label
                                  key={status}
                                  className="inline-flex items-center p-2 border rounded-md border-gray-300 cursor-pointer hover:bg-gray-50"
                                >
                                  <input
                                    type="radio"
                                    name="status"
                                    value={status}
                                    checked={editedBooking.status === status}
                                    onChange={handleEditChange}
                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                                  />
                                  <span className="ml-2 text-sm text-gray-700 capitalize">
                                    {status}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-y-4">
                          <div className="flex items-center">
                            <Building className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-500">
                                Company
                              </div>
                              <div className="mt-1 text-sm text-gray-900">
                                {selectedBooking.company}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <User className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-500">
                                Contact Person
                              </div>
                              <div className="mt-1 text-sm text-gray-900">
                                {selectedBooking.contactName}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Mail className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-500">
                                Email
                              </div>
                              <div className="mt-1 text-sm text-gray-900">
                                {selectedBooking.contactEmail}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-500">
                                Phone
                              </div>
                              <div className="mt-1 text-sm text-gray-900">
                                {selectedBooking.contactPhone}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-500">
                                Date
                              </div>
                              <div className="mt-1 text-sm text-gray-900">
                                {new Date(
                                  selectedBooking.date,
                                ).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-500">
                                Time
                              </div>
                              <div className="mt-1 text-sm text-gray-900">
                                {selectedBooking.time}
                              </div>
                            </div>
                          </div>
                          {selectedBooking.status === 'rescheduled' && (
                            <div className="flex items-center">
                              <RotateCcw className="h-5 w-5 text-gray-400 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-gray-500">
                                  Originally Scheduled
                                </div>
                                <div className="mt-1 text-sm text-gray-900">
                                  {selectedBooking.originalDate &&
                                    new Date(
                                      selectedBooking.originalDate,
                                    ).toLocaleDateString()}{' '}
                                  at {selectedBooking.originalTime}
                                </div>
                                {selectedBooking.rescheduleReason && (
                                  <div className="mt-1 text-sm text-gray-500 italic">
                                    Reason: {selectedBooking.rescheduleReason}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-500">
                                Purpose
                              </div>
                              <div className="mt-1 text-sm text-gray-900">
                                {selectedBooking.purpose}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-500">
                                Location
                              </div>
                              <div className="mt-1 text-sm text-gray-900">
                                {selectedBooking.location}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Package className="h-5 w-5 text-gray-400 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-gray-500">
                                Product/Service
                              </div>
                              <div className="mt-1 text-sm text-gray-900">
                                {selectedBooking.product}
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-500 mb-2">
                              Additional Information
                            </div>
                            <div className="text-sm text-gray-900 bg-gray-50 p-4 rounded-md whitespace-pre-wrap break-words leading-relaxed max-h-96 overflow-y-auto">
                              {selectedBooking.additionalInfo ||
                                'No additional information provided.'}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-500 mb-1">
                              Status
                            </div>
                            <div className="text-sm">
                              {getStatusBadge(selectedBooking.status)}
                            </div>
                          </div>
                          {selectedBooking.isCompleted !== undefined && (
                            <div>
                              <div className="text-sm font-medium text-gray-500 mb-1">
                                Completion Status
                              </div>
                              <div className="text-sm">
                                {getCompletionBadge(
                                  selectedBooking.isCompleted,
                                )}
                              </div>
                            </div>
                          )}
                          {selectedBooking.conclusion && (
                            <div>
                              <div className="text-sm font-medium text-gray-500 mb-2">
                                Meeting Conclusion
                              </div>
                              <div className="text-sm text-gray-900 bg-gray-50 p-4 rounded-md whitespace-pre-wrap break-words leading-relaxed max-h-96 overflow-y-auto">
                                {selectedBooking.conclusion}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {isEditMode ? (
                  <>
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={saveEditedBooking}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </button>
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={toggleEditMode}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex flex-wrap justify-end gap-2">
                      {selectedBooking.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:w-auto sm:text-sm"
                            onClick={() => {
                              updateBookingStatus(
                                selectedBooking._id,
                                'confirmed',
                              )
                              setIsDetailModalOpen(false)
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Confirm
                          </button>
                          <button
                            type="button"
                            className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:w-auto sm:text-sm"
                            onClick={openRescheduleModal}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reschedule
                          </button>
                          <button
                            type="button"
                            className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm"
                            onClick={() => {
                              updateBookingStatus(
                                selectedBooking._id,
                                'cancelled',
                              )
                              setIsDetailModalOpen(false)
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel
                          </button>
                        </>
                      )}
                      {(selectedBooking.status === 'confirmed' ||
                        selectedBooking.status === 'rescheduled') &&
                        !selectedBooking.isCompleted && (
                          <>
                            <button
                              type="button"
                              className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
                              onClick={openCompletionModal}
                            >
                              <CheckSquare className="h-4 w-4 mr-2" />
                              Mark as Complete
                            </button>
                            <button
                              type="button"
                              className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:w-auto sm:text-sm"
                              onClick={openRescheduleModal}
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Reschedule
                            </button>
                          </>
                        )}
                      {selectedBooking.status === 'cancelled' && (
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm"
                          onClick={() => deleteBooking(selectedBooking._id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Booking
                        </button>
                      )}
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
                        onClick={() => setIsDetailModalOpen(false)}
                      >
                        Close
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Create New Booking Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Create New Booking
                      </h3>
                    </div>
                    <div className="border-t border-gray-200 py-3">
                      <div className="grid grid-cols-1 gap-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {renderFormField(
                            'Date',
                            'date',
                            'date',
                            newBooking.date,
                            handleNewBookingChange,
                            null,
                            <Calendar />,
                          )}
                          {renderFormField(
                            'Time',
                            'time',
                            'time',
                            newBooking.time,
                            handleNewBookingChange,
                            null,
                            <Clock />,
                          )}
                        </div>
                        {renderFormField(
                          'Company',
                          'company',
                          'text',
                          newBooking.company,
                          handleNewBookingChange,
                          null,
                          <Building />,
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {renderFormField(
                            'Contact Name',
                            'contactName',
                            'text',
                            newBooking.contactName,
                            handleNewBookingChange,
                            null,
                            <User />,
                          )}
                          {renderFormField(
                            'Email',
                            'contactEmail',
                            'email',
                            newBooking.contactEmail,
                            handleNewBookingChange,
                            null,
                            <Mail />,
                          )}
                        </div>
                        {renderFormField(
                          'Phone',
                          'contactPhone',
                          'tel',
                          newBooking.contactPhone,
                          handleNewBookingChange,
                          null,
                          <Phone />,
                        )}
                        {renderFormField(
                          'Purpose',
                          'purpose',
                          'select',
                          newBooking.purpose,
                          handleNewBookingChange,
                          meetingPurposes,
                          <FileText />,
                        )}
                        {renderFormField(
                          'Location',
                          'location',
                          'select',
                          newBooking.location,
                          handleNewBookingChange,
                          meetingLocations,
                          <MapPin />,
                        )}
                        {renderFormField(
                          'Product/Service',
                          'product',
                          'select',
                          newBooking.product,
                          handleNewBookingChange,
                          productCategories,
                          <Package />,
                        )}
                        {renderFormField(
                          'Additional Information',
                          'additionalInfo',
                          'textarea',
                          newBooking.additionalInfo,
                          handleNewBookingChange,
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {statusOptions.map((status) => (
                              <label
                                key={status}
                                className="inline-flex items-center p-2 border rounded-md border-gray-300 cursor-pointer hover:bg-gray-50"
                              >
                                <input
                                  type="radio"
                                  name="status"
                                  value={status}
                                  checked={newBooking.status === status}
                                  onChange={handleNewBookingChange}
                                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                                />
                                <span className="ml-2 text-sm text-gray-700 capitalize">
                                  {status}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={createNewBooking}
                >
                  Create Booking
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Reschedule Modal */}
      {isRescheduleModalOpen && selectedBooking && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Reschedule Meeting
                    </h3>
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-4">
                        Current schedule:{' '}
                        <span className="font-medium">
                          {new Date(selectedBooking.date).toLocaleDateString()}{' '}
                          at {selectedBooking.time}
                        </span>
                      </p>
                      <div className="grid grid-cols-1 gap-4 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {renderFormField(
                            'New Date',
                            'date',
                            'date',
                            editedBooking?.date || '',
                            handleEditChange,
                            null,
                            <Calendar />,
                          )}
                          {renderFormField(
                            'New Time',
                            'time',
                            'time',
                            editedBooking?.time || '',
                            handleEditChange,
                            null,
                            <Clock />,
                          )}
                        </div>
                        <div>
                          <label
                            htmlFor="rescheduleReason"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Reason for Rescheduling
                          </label>
                          <textarea
                            id="rescheduleReason"
                            name="rescheduleReason"
                            rows={3}
                            value={rescheduleReason}
                            onChange={(e) =>
                              setRescheduleReason(e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Please provide a reason for rescheduling..."
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={rescheduleBooking}
                >
                  Reschedule
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setIsRescheduleModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Meeting Completion Modal */}
      {isCompletionModalOpen && selectedBooking && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Complete Meeting
                    </h3>
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-4">
                        Mark meeting with{' '}
                        <span className="font-medium">
                          {selectedBooking.company}
                        </span>{' '}
                        as completed and add conclusion notes.
                      </p>
                      <div>
                        <label
                          htmlFor="conclusion"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Meeting Conclusion / Notes
                        </label>
                        <textarea
                          id="conclusion"
                          name="conclusion"
                          rows={5}
                          value={conclusion}
                          onChange={(e) => setConclusion(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Enter meeting outcome, action items, and any follow-up required..."
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() =>
                    markBookingAsCompleted(selectedBooking._id, conclusion)
                  }
                >
                  Mark as Complete
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setIsCompletionModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* User Edit Modal */}
      {isUserModalOpen && selectedUser && editedUser && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Edit User: {selectedUser.name}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          User Information
                        </label>
                        <div className="bg-gray-50 p-4 rounded-md space-y-2">
                          <p className="text-sm"><span className="font-medium">Email:</span> {selectedUser.email}</p>
                          <p className="text-sm"><span className="font-medium">Company:</span> {selectedUser.company || 'N/A'}</p>
                          <p className="text-sm"><span className="font-medium">Phone:</span> {selectedUser.phone || 'N/A'}</p>
                          <p className="text-sm"><span className="font-medium">Created:</span> {new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          User Role
                        </label>
                        {selectedUser.role === 'superadmin' && !isSuperAdmin ? (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-2">
                            <p className="text-sm text-yellow-800">
                              <Shield className="inline h-4 w-4 mr-1" />
                              Only super admins can modify super admin roles.
                            </p>
                          </div>
                        ) : null}
                        <div className="space-y-2">
                          <label className={`inline-flex items-center p-3 border rounded-md border-gray-300 ${selectedUser.role === 'superadmin' && !isSuperAdmin ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'} w-full`}>
                            <input
                              type="radio"
                              name="role"
                              value="user"
                              checked={editedUser.role === 'user'}
                              onChange={(e) => setEditedUser({ ...editedUser, role: e.target.value as 'user' | 'admin' | 'superadmin' })}
                              disabled={selectedUser.role === 'superadmin' && !isSuperAdmin}
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                            />
                            <span className="ml-3 text-sm text-gray-700">User - Standard access</span>
                          </label>
                          <label className={`inline-flex items-center p-3 border rounded-md border-gray-300 ${(selectedUser.role === 'superadmin' || selectedUser.role === 'admin') && !isSuperAdmin ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'} w-full`}>
                            <input
                              type="radio"
                              name="role"
                              value="admin"
                              checked={editedUser.role === 'admin'}
                              onChange={(e) => setEditedUser({ ...editedUser, role: e.target.value as 'user' | 'admin' | 'superadmin' })}
                              disabled={(selectedUser.role === 'superadmin' || selectedUser.role === 'admin') && !isSuperAdmin}
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                            />
                            <span className="ml-3 text-sm text-gray-700">Admin - Full access to dashboard</span>
                          </label>
                          {isSuperAdmin && (
                            <label className="inline-flex items-center p-3 border rounded-md border-red-300 cursor-pointer hover:bg-red-50 w-full">
                              <input
                                type="radio"
                                name="role"
                                value="superadmin"
                                checked={editedUser.role === 'superadmin'}
                                onChange={(e) => setEditedUser({ ...editedUser, role: e.target.value as 'user' | 'admin' | 'superadmin' })}
                                className="focus:ring-red-500 h-4 w-4 text-red-600 border-gray-300"
                              />
                              <span className="ml-3 text-sm text-gray-700">
                                <Shield className="inline h-4 w-4 mr-1 text-red-600" />
                                Super Admin - Unrestricted access & user role management
                              </span>
                            </label>
                          )}
                        </div>
                        {!isSuperAdmin && (
                          <p className="mt-2 text-xs text-gray-500">
                            Note: Only super admins can change admin roles or create super admins.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => updateUserRole(selectedUser._id, editedUser.role)}
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setIsUserModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Past Bookings Warning Modal */}
      {showPastBookingsWarning && pastBookings.length > 0 && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertCircle className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Past Bookings Require Attention
                    </h3>
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-4">
                        You have {pastBookings.length} booking{pastBookings.length > 1 ? 's' : ''} that {pastBookings.length > 1 ? 'are' : 'is'} past the current date. Please review and take action:
                      </p>
                      <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {pastBookings.map((booking) => (
                              <tr key={booking._id}>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  {new Date(booking.date).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900">{booking.company}</td>
                                <td className="px-4 py-2 text-sm">
                                  {getStatusBadge(booking.status)}
                                </td>
                                <td className="px-4 py-2 text-sm">
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => {
                                        setSelectedBooking(booking)
                                        setEditedBooking({ ...booking })
                                        setShowPastBookingsWarning(false)
                                        openCompletionModal()
                                      }}
                                      className="text-blue-600 hover:text-blue-900 text-xs"
                                    >
                                      Complete
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedBooking(booking)
                                        setEditedBooking({ ...booking })
                                        setShowPastBookingsWarning(false)
                                        openRescheduleModal()
                                      }}
                                      className="text-indigo-600 hover:text-indigo-900 text-xs"
                                    >
                                      Reschedule
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={markAllPastAsCompleted}
                >
                  Mark All as Complete
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={dismissPastBookingsWarning}
                >
                  Dismiss for Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User History Modal */}
      {historyUser && (
        <UserHistoryModal
          userId={historyUser._id}
          userName={historyUser.name}
          userEmail={historyUser.email}
          isOpen={userHistoryModalOpen}
          onClose={() => setUserHistoryModalOpen(false)}
        />
      )}
    </div>
  )
}

