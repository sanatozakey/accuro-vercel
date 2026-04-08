import React, { useEffect, useState, useCallback, useMemo, cloneElement } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
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
  LogOut,
  Home,
  Menu,
  X,
  Sun,
  Moon,
  Settings,
  Download,
  Square,
  CheckSquare2,
  Pencil,
  MessageCircle,
  UserCheck,
  ArrowRightLeft,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import bookingService, { getTechnicianLabel, getTechnicianRealName } from '../services/bookingService'
import userService, { User as UserType } from '../services/userService'
import analyticsService from '../services/analyticsService'
import reviewService, { Review } from '../services/reviewService'
import activityLogService, { ActivityLog } from '../services/activityLogService'
import recommendationAdminService, { RecommendationStats, UserInteraction } from '../services/recommendationAdminService'
import AnalyticsDashboard from '../components/AnalyticsDashboard'
import { SimpleReportsTab } from '../components/SimpleReportsTab'
import { UserHistoryModal } from '../components/UserHistoryModal'
import { GoogleCalendarSettings } from '../components/GoogleCalendarSettings'
import { EmbeddedGoogleCalendar } from '../components/EmbeddedGoogleCalendar'
import { CompletionProofModal } from '../components/CompletionProofModal'
import { BulkCompletionWizard } from '../components/BulkCompletionWizard'
import { CompletionReviewModal } from '../components/CompletionReviewModal'
import completionProofService, { CompletionProof } from '../services/completionProofService'
import { AdminReviewsManager } from '../components/AdminReviewsManager'
import { EnhancedReportsTab } from '../components/EnhancedReportsTab'
import { CalendarView } from '../components/CalendarView'
import { AdminSettings } from '../components/AdminSettings'
import { DashboardOverview } from '../components/DashboardOverview'
import { ProductManagement } from './ProductManagement'
import { QuotationDashboard } from './QuotationDashboard'
import { UserManagement } from '../components/UserManagement'
import { SessionManagement } from '../components/SessionManagement'
import { ActivityLogViewer } from '../components/ActivityLogViewer'
import { DataExportPanel } from '../components/DataExportPanel'
import { Pagination } from '../components/Pagination'
import { BulkEmailPanel } from '../components/BulkEmailPanel'
import { RateLimitDashboard } from '../components/RateLimitDashboard'
import { BookingCalendarView } from '../components/BookingCalendarView'
import { TwoFactorSetup } from '../components/TwoFactorSetup'
import { AccountSettings } from '../components/AccountSettings'
import { AdminChatDashboard } from './AdminChatDashboard'
import api from '../services/api'
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
  assignedTechnician?: {
    _id: string
    name: string
    email: string
    phone?: string
    profilePicture?: string
  } | null
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
  'in_progress',
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
  const [searchParams] = useSearchParams()
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    const tab = searchParams.get('tab')
    if (tab === 'pending-review') return 'pending_review'
    return 'all'
  })
  const [completionFilter, setCompletionFilter] = useState<string>('all')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false)
  const [isEditMode, setIsEditMode] = useState<boolean>(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false)
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] =
    useState<boolean>(false)
  const [isCompletionModalOpen, setIsCompletionModalOpen] =
    useState<boolean>(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false)
  const [reviewProof, setReviewProof] = useState<CompletionProof | null>(null)
  const [revisionMode, setRevisionMode] = useState<boolean>(false)
  const [revisionProof, setRevisionProof] = useState<CompletionProof | null>(null)

  // Dispatch & Reassign modal state
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState<boolean>(false)
  const [isReassignModalOpen, setIsReassignModalOpen] = useState<boolean>(false)
  const [dispatchBooking, setDispatchBooking] = useState<Booking | null>(null)
  const [reassignBooking, setReassignBooking] = useState<Booking | null>(null)
  const [availableTechnicians, setAvailableTechnicians] = useState<Array<{ _id: string; name: string; email: string; phone?: string; profilePicture?: string; isAvailable: boolean }>>([])
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>('')
  const [techLoading, setTechLoading] = useState<boolean>(false)
  const [dispatchLoading, setDispatchLoading] = useState<boolean>(false)
  const [rejectedProofMap, setRejectedProofMap] = useState<Record<string, CompletionProof>>({})
  const [rescheduleReason, setRescheduleReason] = useState<string>('')
  const [editedBooking, setEditedBooking] = useState<Booking | null>(null)
  const [viewMode, setViewMode] = useState<'dashboard' | 'table' | 'calendar' | 'products' | 'quotations' | 'users' | 'analytics' | 'activityLogs' | 'reviews' | 'reports' | 'settings' | 'rateLimits' | 'security' | 'chat'>(() => {
    const tab = searchParams.get('tab')
    if (tab === 'chat') return 'chat'
    return 'dashboard'
  })
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])

  // UI state
  const [darkMode, setDarkMode] = useState<boolean>(false) // Default to light mode
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false) // Mobile sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false) // Desktop sidebar collapsed state
  const [unreadChatCount, setUnreadChatCount] = useState(0)

  // Booking pagination state
  const BOOKINGS_PER_PAGE = 15
  const [bookingPage, setBookingPage] = useState(1)

  // Bulk actions state
  const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set())
  const [bulkActionLoading, setBulkActionLoading] = useState<boolean>(false)

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
  const [showBulkCompletionWizard, setShowBulkCompletionWizard] = useState<boolean>(false)

  // Read/unread tracking for bookings (persisted in localStorage)
  const [readBookingIds, setReadBookingIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('admin_read_bookings')
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch { return new Set() }
  })

  const markBookingAsRead = (bookingId: string) => {
    setReadBookingIds(prev => {
      const next = new Set(prev)
      next.add(bookingId)
      localStorage.setItem('admin_read_bookings', JSON.stringify([...next]))
      return next
    })
  }

  const markAllBookingsAsRead = () => {
    const allIds = bookings.map(b => b._id)
    setReadBookingIds(() => {
      const next = new Set(allIds)
      localStorage.setItem('admin_read_bookings', JSON.stringify([...next]))
      return next
    })
  }

  const isBookingUnread = (bookingId: string): boolean => !readBookingIds.has(bookingId)

  const unreadBookingCount = bookings.filter(b => isBookingUnread(b._id)).length

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
  const fetchRejectedProofs = async (): Promise<void> => {
    try {
      const response = await completionProofService.getAll({ status: 'rejected' })
      if (response.success && response.data) {
        const map: Record<string, CompletionProof> = {}
        for (const proof of response.data) {
          const bookingId = typeof proof.bookingId === 'string' ? proof.bookingId : (proof.bookingId as any)?._id || ''
          if (bookingId) map[bookingId] = proof
        }
        setRejectedProofMap(map)
      }
    } catch (err) {
      console.error('Failed to fetch rejected proofs:', err)
    }
  }

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
    fetchRejectedProofs()
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
      // Only show if not dismissed this session
      const dismissed = sessionStorage.getItem('pastBookingsBannerDismissed')
      if (!dismissed) {
        setShowPastBookingsWarning(true)
      }
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

  // Fetch unread chat count for sidebar badge
  useEffect(() => {
    const fetchChatUnread = async () => {
      try {
        const res = await api.get('/chat/admin-unread-count')
        if (res.data.success) {
          setUnreadChatCount(res.data.data?.unreadCount ?? 0)
        }
      } catch (err) {
        // Chat not available, ignore
      }
    }
    fetchChatUnread()
    const interval = setInterval(fetchChatUnread, 30000)
    return () => clearInterval(interval)
  }, [])

  // Create calendar events from filteredBookings (so filters work in calendar view)
  useEffect(() => {
    const events: CalendarEvent[] = []

    filteredBookings.forEach((booking) => {
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
        if (booking.status === 'completed') backgroundColor = '#3b82f6'
        if (booking.status === 'pending_review') backgroundColor = '#6366f1'

        // Override color to grey for overdue bookings (past date, not completed/cancelled)
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        const bookingDate = new Date(year, month - 1, day)
        if (bookingDate < now && booking.status !== 'completed' && booking.status !== 'cancelled') {
          backgroundColor = '#9ca3af'
        }

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
    if (statusFilter === 'rejected_report') {
      result = result.filter((booking) => booking.status === 'confirmed' && rejectedProofMap[booking._id])
    } else if (statusFilter !== 'all') {
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
    // Sort by most recent booking date first (newest at top)
    result = [...result].sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time || '00:00'}`).getTime()
      const dateB = new Date(`${b.date} ${b.time || '00:00'}`).getTime()
      return dateB - dateA
    })
    setFilteredBookings(result)
    setBookingPage(1) // Reset to first page on filter change
  }, [searchTerm, statusFilter, completionFilter, bookings, rejectedProofMap])

  // Client-side pagination for booking table view
  const bookingTotalPages = Math.ceil(filteredBookings.length / BOOKINGS_PER_PAGE)
  const paginatedBookings = filteredBookings.slice(
    (bookingPage - 1) * BOOKINGS_PER_PAGE,
    bookingPage * BOOKINGS_PER_PAGE
  )
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
      toast.success(`Booking status updated to "${newStatus}"`)
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update booking status'
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }
  // Open dispatch modal for confirming a booking with technician assignment
  const openDispatchModal = async (booking: Booking): Promise<void> => {
    setDispatchBooking(booking)
    setSelectedTechnicianId('')
    setIsDispatchModalOpen(true)
    setTechLoading(true)
    try {
      const response = await bookingService.checkTechnicianAvailability(booking.date, booking.time)
      setAvailableTechnicians(response.data)
    } catch (err: any) {
      toast.error('Failed to load technicians')
      setAvailableTechnicians([])
    } finally {
      setTechLoading(false)
    }
  }

  // Handle confirm & dispatch
  const handleConfirmAndDispatch = async (): Promise<void> => {
    if (!dispatchBooking || !selectedTechnicianId) {
      toast.error('Please select a technician')
      return
    }
    setDispatchLoading(true)
    try {
      const response = await bookingService.confirmAndDispatch(dispatchBooking._id, selectedTechnicianId)
      if (response.hasConflict) {
        toast.success(response.message || 'Booking confirmed with conflict warning', { duration: 5000 })
      } else {
        toast.success(response.message || 'Booking confirmed and dispatched')
      }
      await fetchBookings()
      setIsDispatchModalOpen(false)
      setDispatchBooking(null)
      setIsDetailModalOpen(false)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to confirm and dispatch')
    } finally {
      setDispatchLoading(false)
    }
  }

  // Open reassign modal
  const openReassignModal = async (booking: Booking): Promise<void> => {
    setReassignBooking(booking)
    setSelectedTechnicianId('')
    setIsReassignModalOpen(true)
    setTechLoading(true)
    try {
      const response = await bookingService.checkTechnicianAvailability(booking.date, booking.time)
      setAvailableTechnicians(response.data)
    } catch (err: any) {
      toast.error('Failed to load technicians')
      setAvailableTechnicians([])
    } finally {
      setTechLoading(false)
    }
  }

  // Handle reassign technician
  const handleReassignTechnician = async (): Promise<void> => {
    if (!reassignBooking || !selectedTechnicianId) {
      toast.error('Please select a technician')
      return
    }
    setDispatchLoading(true)
    try {
      const response = await bookingService.reassignTechnician(reassignBooking._id, selectedTechnicianId)
      toast.success(response.message || 'Technician reassigned successfully')
      await fetchBookings()
      setIsReassignModalOpen(false)
      setReassignBooking(null)
      setIsDetailModalOpen(false)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reassign technician')
    } finally {
      setDispatchLoading(false)
    }
  }

  // Handle completion - called after proof is created
  const handleBookingCompleted = async (): Promise<void> => {
    // Refresh bookings and rejected proofs from server
    await fetchBookings()
    await fetchRejectedProofs()
    setIsCompletionModalOpen(false)
    setIsDetailModalOpen(false)
    setRevisionMode(false)
    setRevisionProof(null)
  }

  // Open review modal (superadmin reviews a pending_review booking)
  const openReviewModal = async (booking: Booking): Promise<void> => {
    try {
      const response = await completionProofService.getByBookingId(booking._id)
      if (response.success && response.data) {
        setSelectedBooking(booking)
        setReviewProof(response.data)
        setIsReviewModalOpen(true)
      } else {
        toast.error('Completion proof not found for this booking')
      }
    } catch (error: any) {
      toast.error('Failed to load completion proof')
    }
  }

  // Open revision modal (admin revises a rejected report)
  const openRevisionModal = async (booking: Booking): Promise<void> => {
    try {
      const response = await completionProofService.getByBookingId(booking._id)
      if (response.success && response.data && response.data.status === 'rejected') {
        setSelectedBooking(booking)
        setRevisionProof(response.data)
        setRevisionMode(true)
        setIsCompletionModalOpen(true)
      } else {
        toast.error('No rejected report found for this booking')
      }
    } catch (error: any) {
      toast.error('Failed to load completion proof')
    }
  }

  const handleReviewDecision = async (): Promise<void> => {
    await fetchBookings()
    await fetchRejectedProofs()
    setIsReviewModalOpen(false)
    setReviewProof(null)
  }

  // Bulk action handlers
  const toggleSelectBooking = (bookingId: string): void => {
    const newSelected = new Set(selectedBookings)
    if (newSelected.has(bookingId)) {
      newSelected.delete(bookingId)
    } else {
      newSelected.add(bookingId)
    }
    setSelectedBookings(newSelected)
  }

  const toggleSelectAll = (): void => {
    if (selectedBookings.size === filteredBookings.length) {
      setSelectedBookings(new Set())
    } else {
      setSelectedBookings(new Set(filteredBookings.map(b => b._id)))
    }
  }

  const clearSelection = (): void => {
    setSelectedBookings(new Set())
  }

  const bulkUpdateStatus = async (newStatus: string): Promise<void> => {
    if (selectedBookings.size === 0) return
    setBulkActionLoading(true)
    try {
      const promises = Array.from(selectedBookings).map(id =>
        bookingService.update(id, { status: newStatus })
      )
      await Promise.all(promises)
      await fetchBookings()
      toast.success(`${selectedBookings.size} booking(s) updated to "${newStatus}"`)
      clearSelection()
    } catch (err: any) {
      toast.error('Failed to update some bookings')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const bulkDelete = async (): Promise<void> => {
    if (selectedBookings.size === 0) return
    if (!window.confirm(`Are you sure you want to delete ${selectedBookings.size} booking(s)? This action cannot be undone.`)) {
      return
    }
    setBulkActionLoading(true)
    try {
      const promises = Array.from(selectedBookings).map(id =>
        bookingService.delete(id)
      )
      await Promise.all(promises)
      await fetchBookings()
      toast.success(`${selectedBookings.size} booking(s) deleted`)
      clearSelection()
    } catch (err: any) {
      toast.error('Failed to delete some bookings')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const exportToCSV = (): void => {
    const bookingsToExport = selectedBookings.size > 0
      ? filteredBookings.filter(b => selectedBookings.has(b._id))
      : filteredBookings

    const headers = ['ID', 'Date', 'Time', 'Company', 'Contact Name', 'Email', 'Phone', 'Purpose', 'Location', 'Product', 'Status', 'Completed', 'Created At']
    const csvRows = [
      headers.join(','),
      ...bookingsToExport.map(b => [
        b._id,
        new Date(b.date).toLocaleDateString(),
        b.time,
        `"${b.company.replace(/"/g, '""')}"`,
        `"${b.contactName.replace(/"/g, '""')}"`,
        b.contactEmail,
        b.contactPhone,
        `"${b.purpose.replace(/"/g, '""')}"`,
        `"${b.location.replace(/"/g, '""')}"`,
        `"${b.product.replace(/"/g, '""')}"`,
        b.status,
        b.isCompleted ? 'Yes' : 'No',
        new Date(b.createdAt).toLocaleDateString(),
      ].join(','))
    ]

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `bookings_export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Exported ${bookingsToExport.length} booking(s) to CSV`)
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
      toast.success('Booking rescheduled successfully!')
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to reschedule booking'
      setError(errorMessage)
      toast.error(errorMessage)
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
    markBookingAsRead(booking._id)
  }
  // Open edit modal
  const openEditModal = (booking: Booking): void => {
    setSelectedBooking(booking)
    setEditedBooking({
      ...booking,
    })
    setIsEditMode(true)
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
      setIsCompletionModalOpen(true)
    }
  }

  // Handle past bookings - open bulk completion wizard
  const openBulkCompletionWizard = (): void => {
    setShowPastBookingsWarning(false)
    setShowBulkCompletionWizard(true)
  }

  // Handle bulk completion wizard close
  const handleBulkCompletionComplete = async (): Promise<void> => {
    await fetchBookings()
    setShowBulkCompletionWizard(false)
    setPastBookings([])
  }

  // Handle past bookings - dismiss warning
  const dismissPastBookingsWarning = (): void => {
    setShowPastBookingsWarning(false)
    sessionStorage.setItem('pastBookingsBannerDismissed', 'true')
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
      toast.error('Please fix the validation errors')
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
      toast.success('Booking updated successfully!')
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update booking'
      setError(errorMessage)
      toast.error(errorMessage)
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
        toast.success('Booking deleted successfully!')
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to delete booking'
        setError(errorMessage)
        toast.error(errorMessage)
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
      case 'pending_review':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <Eye className="w-3 h-3 mr-1" />
            Pending Review
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

  // Memoize sidebar navigation items to avoid re-creating on every render
  const sidebarNavItems = useMemo(() => [
    { section: 'MAIN', items: [
      { key: 'dashboard', icon: Home, label: 'Dashboard' },
      { key: 'table', icon: List, label: 'Bookings' },
      { key: 'calendar', icon: CalendarDays, label: 'Calendar' },
    ]},
    { section: 'MANAGEMENT', items: [
      { key: 'products', icon: Package, label: 'Products' },
      { key: 'users', icon: Users, label: 'Users' },
    ]},
    { section: 'INSIGHTS', items: [
      { key: 'analytics', icon: BarChart3, label: 'Analytics' },
      { key: 'reports', icon: TrendingUp, label: 'Reports' },
      { key: 'reviews', icon: Award, label: 'Reviews' },
      { key: 'activityLogs', icon: Shield, label: 'Activity' },
    ]},
    { section: 'SYSTEM', items: [
      { key: 'settings', icon: Settings, label: 'Settings' },
      { key: 'rateLimits', icon: Shield, label: 'Rate Limits' },
      { key: 'security', icon: Shield, label: 'Security' },
    ]},
  ] as const, []);

  return (
    <div className={`flex min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky inset-y-0 lg:top-0 left-0 z-50 ${sidebarCollapsed ? 'w-16' : 'w-64'} ${darkMode ? 'bg-navy-900 border-gray-800' : 'bg-white border-gray-200'} border-r flex flex-col transition-all duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:h-screen`}>
        {/* Logo and Close Button (Mobile) */}
        <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} h-16 ${sidebarCollapsed ? 'px-2' : 'px-6'} border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          {sidebarCollapsed ? (
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600 text-white font-bold text-xl">
              A
            </div>
          ) : (
            <>
              <img
                src="https://uploadthingy.s3.us-west-1.amazonaws.com/hm7mtaNdbWyZ81qScpSM5S/accuro_logo.png"
                alt="Accuro Logo"
                className="h-8"
              />
              <Button
                onClick={() => setSidebarOpen(false)}
                variant="ghost"
                size="sm"
                className="lg:hidden"
              >
                <X className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className={`flex-1 px-4 py-6 space-y-1 ${!sidebarCollapsed && 'overflow-y-auto'}`}>
          {/* MAIN Section */}
          {!sidebarCollapsed && (
            <div className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Main
            </div>
          )}

          <Button
            onClick={() => {
              setViewMode('dashboard')
              setSidebarOpen(false)
            }}
            variant={viewMode === 'dashboard' ? 'default' : 'ghost'}
            className={`w-full ${sidebarCollapsed ? 'justify-center' : 'justify-start'} ${
              viewMode === 'dashboard'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : darkMode
                ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Dashboard"
          >
            <Home className={`h-5 w-5 ${!sidebarCollapsed && 'mr-3'}`} />
            {!sidebarCollapsed && 'Dashboard'}
          </Button>

          <Button
            onClick={() => {
              setViewMode('table')
              setSidebarOpen(false)
            }}
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            className={`w-full ${sidebarCollapsed ? 'justify-center' : 'justify-start'} ${
              viewMode === 'table'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : darkMode
                ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Bookings"
          >
            <div className="relative">
              <List className={`h-5 w-5 ${!sidebarCollapsed && 'mr-3'}`} />
              {unreadBookingCount > 0 && sidebarCollapsed && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </div>
            {!sidebarCollapsed && (
              <>
                Bookings
                {unreadBookingCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-[1.25rem] flex items-center justify-center px-1">
                    {unreadBookingCount > 99 ? '99+' : unreadBookingCount}
                  </span>
                )}
              </>
            )}
          </Button>

          <Button
            onClick={() => {
              setViewMode('calendar')
              setSidebarOpen(false)
            }}
            variant={viewMode === 'calendar' ? 'default' : 'ghost'}
            className={`w-full ${sidebarCollapsed ? 'justify-center' : 'justify-start'} ${
              viewMode === 'calendar'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : darkMode
                ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Calendar"
          >
            <CalendarDays className={`h-5 w-5 ${!sidebarCollapsed && 'mr-3'}`} />
            {!sidebarCollapsed && 'Calendar'}
          </Button>

          {/* MANAGE Section */}
          {!sidebarCollapsed && (
            <div className={`px-3 py-2 mt-4 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Manage
            </div>
          )}
          {sidebarCollapsed && <div className="my-2 border-t border-gray-700" />}

          <Button
            onClick={() => {
              setViewMode('products')
              setSidebarOpen(false)
            }}
            variant={viewMode === 'products' ? 'default' : 'ghost'}
            className={`w-full ${sidebarCollapsed ? 'justify-center' : 'justify-start'} ${
              viewMode === 'products'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : darkMode
                ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Products"
          >
            <Package className={`h-5 w-5 ${!sidebarCollapsed && 'mr-3'}`} />
            {!sidebarCollapsed && 'Products'}
          </Button>

          <Button
            onClick={() => {
              setViewMode('quotations')
              setSidebarOpen(false)
            }}
            variant={viewMode === 'quotations' ? 'default' : 'ghost'}
            className={`w-full ${sidebarCollapsed ? 'justify-center' : 'justify-start'} ${
              viewMode === 'quotations'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : darkMode
                ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Quotations"
          >
            <FileText className={`h-5 w-5 ${!sidebarCollapsed && 'mr-3'}`} />
            {!sidebarCollapsed && 'Quotations'}
          </Button>

          <Button
            onClick={() => {
              setViewMode('users')
              setSidebarOpen(false)
            }}
            variant={viewMode === 'users' ? 'default' : 'ghost'}
            className={`w-full ${sidebarCollapsed ? 'justify-center' : 'justify-start'} ${
              viewMode === 'users'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : darkMode
                ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Users"
          >
            <Users className={`h-5 w-5 ${!sidebarCollapsed && 'mr-3'}`} />
            {!sidebarCollapsed && 'Users'}
          </Button>

          <Button
            onClick={() => {
              setViewMode('chat')
              setSidebarOpen(false)
            }}
            variant={viewMode === 'chat' ? 'default' : 'ghost'}
            className={`w-full ${sidebarCollapsed ? 'justify-center' : 'justify-start'} ${
              viewMode === 'chat'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : darkMode
                  ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Chat Support"
          >
            <div className="relative">
              <MessageCircle className={`h-5 w-5 ${!sidebarCollapsed && 'mr-3'}`} />
              {unreadChatCount > 0 && sidebarCollapsed && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </div>
            {!sidebarCollapsed && (
              <>
                Chat Support
                {unreadChatCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-[1.25rem] flex items-center justify-center px-1">
                    {unreadChatCount > 99 ? '99+' : unreadChatCount}
                  </span>
                )}
              </>
            )}
          </Button>

          {/* INSIGHTS Section */}
          {!sidebarCollapsed && (
            <div className={`px-3 py-2 mt-4 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Insights
            </div>
          )}
          {sidebarCollapsed && <div className="my-2 border-t border-gray-700" />}

          <Button
            onClick={() => {
              setViewMode('analytics')
              setSidebarOpen(false)
            }}
            variant={viewMode === 'analytics' ? 'default' : 'ghost'}
            className={`w-full ${sidebarCollapsed ? 'justify-center' : 'justify-start'} ${
              viewMode === 'analytics'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : darkMode
                ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Analytics"
          >
            <BarChart3 className={`h-5 w-5 ${!sidebarCollapsed && 'mr-3'}`} />
            {!sidebarCollapsed && 'Analytics'}
          </Button>

          <Button
            onClick={() => {
              setViewMode('reports')
              setSidebarOpen(false)
            }}
            variant={viewMode === 'reports' ? 'default' : 'ghost'}
            className={`w-full ${sidebarCollapsed ? 'justify-center' : 'justify-start'} ${
              viewMode === 'reports'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : darkMode
                ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Reports"
          >
            <TrendingUp className={`h-5 w-5 ${!sidebarCollapsed && 'mr-3'}`} />
            {!sidebarCollapsed && 'Reports'}
          </Button>

          <Button
            onClick={() => {
              setViewMode('reviews')
              setSidebarOpen(false)
            }}
            variant={viewMode === 'reviews' ? 'default' : 'ghost'}
            className={`w-full ${sidebarCollapsed ? 'justify-center' : 'justify-start'} ${
              viewMode === 'reviews'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : darkMode
                ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Reviews"
          >
            <Award className={`h-5 w-5 ${!sidebarCollapsed && 'mr-3'}`} />
            {!sidebarCollapsed && 'Reviews'}
          </Button>

          <Button
            onClick={() => {
              setViewMode('activityLogs')
              setSidebarOpen(false)
            }}
            variant={viewMode === 'activityLogs' ? 'default' : 'ghost'}
            className={`w-full ${sidebarCollapsed ? 'justify-center' : 'justify-start'} ${
              viewMode === 'activityLogs'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : darkMode
                ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Activity"
          >
            <Shield className={`h-5 w-5 ${!sidebarCollapsed && 'mr-3'}`} />
            {!sidebarCollapsed && 'Activity'}
          </Button>

          {/* SYSTEM Section */}
          {!sidebarCollapsed && (
            <div className={`px-3 py-2 mt-4 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              System
            </div>
          )}
          {sidebarCollapsed && <div className="my-2 border-t border-gray-700" />}

          <Button
            onClick={() => {
              setViewMode('settings')
              setSidebarOpen(false)
            }}
            variant={viewMode === 'settings' ? 'default' : 'ghost'}
            className={`w-full ${sidebarCollapsed ? 'justify-center' : 'justify-start'} ${
              viewMode === 'settings'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : darkMode
                ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Settings"
          >
            <Settings className={`h-5 w-5 ${!sidebarCollapsed && 'mr-3'}`} />
            {!sidebarCollapsed && 'Settings'}
          </Button>

          <Button
            onClick={() => {
              setViewMode('rateLimits')
              setSidebarOpen(false)
            }}
            variant={viewMode === 'rateLimits' ? 'default' : 'ghost'}
            className={`w-full ${sidebarCollapsed ? 'justify-center' : 'justify-start'} ${
              viewMode === 'rateLimits'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : darkMode
                ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Rate Limits"
          >
            <Shield className={`h-5 w-5 ${!sidebarCollapsed && 'mr-3'}`} />
            {!sidebarCollapsed && 'Rate Limits'}
          </Button>

          <Button
            onClick={() => {
              setViewMode('security')
              setSidebarOpen(false)
            }}
            variant={viewMode === 'security' ? 'default' : 'ghost'}
            className={`w-full ${sidebarCollapsed ? 'justify-center' : 'justify-start'} ${
              viewMode === 'security'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : darkMode
                ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Security"
          >
            <Shield className={`h-5 w-5 ${!sidebarCollapsed && 'mr-3'}`} />
            {!sidebarCollapsed && 'Security'}
          </Button>
        </nav>

        {/* Bottom Actions */}
        <div className={`p-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'} space-y-2`}>
          {/* Dark Mode Toggle */}
          <Button
            onClick={() => setDarkMode(!darkMode)}
            variant="ghost"
            className={`w-full ${sidebarCollapsed ? 'justify-center' : 'justify-start'} ${
              darkMode
                ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className={`h-5 w-5 ${!sidebarCollapsed && 'mr-3'}`} /> : <Moon className={`h-5 w-5 ${!sidebarCollapsed && 'mr-3'}`} />}
            {!sidebarCollapsed && (darkMode ? 'Light Mode' : 'Dark Mode')}
          </Button>

          {/* Collapse Sidebar (Desktop Only) */}
          <Button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            variant="ghost"
            className={`hidden lg:flex w-full ${sidebarCollapsed ? 'justify-center' : 'justify-start'} ${
              darkMode
                ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <Menu className={`h-5 w-5 ${!sidebarCollapsed && 'mr-3'}`} />
            {!sidebarCollapsed && 'Collapse'}
          </Button>

          {/* Back to Website */}
          <Button
            asChild
            variant="ghost"
            className={`w-full ${sidebarCollapsed ? 'justify-center' : 'justify-start'} ${
              darkMode
                ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Back to Website"
          >
            <a href="/">
              <Home className={`h-5 w-5 ${!sidebarCollapsed && 'mr-3'}`} />
              {!sidebarCollapsed && 'Back to Website'}
            </a>
          </Button>

          {/* Logout */}
          <Button
            onClick={logout}
            variant="ghost"
            className={`w-full ${sidebarCollapsed ? 'justify-center' : 'justify-start'} ${
              darkMode
                ? 'text-red-400 hover:text-red-300 hover:bg-red-950'
                : 'text-red-600 hover:text-red-700 hover:bg-red-100'
            }`}
            title="Logout"
          >
            <LogOut className={`h-5 w-5 ${!sidebarCollapsed && 'mr-3'}`} />
            {!sidebarCollapsed && 'Logout'}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className="flex-1 transition-all duration-300 overflow-hidden min-w-0"
        onClick={() => {
          // Auto-close sidebar on mobile when clicking main content
          if (sidebarOpen) {
            setSidebarOpen(false)
          }
        }}
      >
        {/* Header */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-sm border-b`}>
          <div className="px-4 sm:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile Hamburger Menu */}
              <Button
                onClick={(e) => {
                  e.stopPropagation() // Prevent closing when opening
                  setSidebarOpen(true)
                }}
                variant="ghost"
                size="sm"
                className="lg:hidden"
              >
                <Menu className="h-6 w-6" />
              </Button>

              <div>
                <h1 className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Admin Dashboard</h1>
                {currentUser && (
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                    Welcome back, {currentUser.name}
                    {isSuperAdmin && (
                      <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded bg-blue-600 text-white">Super Admin</span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-8 overflow-y-auto h-[calc(100vh-5rem)]">
          {/* Error Message */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-red-700">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span>{error}</span>
                  </div>
                  <Button
                    onClick={() => setError('')}
                    variant="ghost"
                    size="sm"
                    className="text-red-700 hover:text-red-900 hover:bg-red-100"
                  >
                    <XCircle className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Past Bookings Banner */}
          {showPastBookingsWarning && pastBookings.length > 0 && (
            <div className={`mb-4 rounded-lg border ${darkMode ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'}`}>
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                  <p className={`text-sm font-medium ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                    {pastBookings.length} past booking{pastBookings.length > 1 ? 's' : ''} need attention
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  <button
                    onClick={openBulkCompletionWizard}
                    className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                  >
                    Review All
                  </button>
                  <button
                    onClick={() => {
                      setStatusFilter('all')
                      setViewMode('table')
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
                  >
                    View in Table
                  </button>
                  <button
                    onClick={dismissPastBookingsWarning}
                    className={`p-1.5 rounded-md transition ${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                    title="Dismiss"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading bookings...</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {!loading && (
            <>
        {/* Filters and Actions - Only show for booking-related views */}
        {(viewMode === 'table' || viewMode === 'calendar') && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 mb-6`}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-3 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
                <input
                  type="text"
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    darkMode
                      ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                      : 'border-gray-300 bg-white placeholder-gray-500'
                  } rounded-md leading-5 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="Search by company or contact"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="md:col-span-3">
                <select
                  className={`block w-full pl-3 pr-10 py-2 text-base border ${
                    darkMode
                      ? 'border-gray-600 bg-gray-700 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                  } focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md`}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="rejected_report">Rejected Reports</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="rescheduled">Rescheduled</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <select
                  className={`block w-full pl-3 pr-10 py-2 text-base border ${
                    darkMode
                      ? 'border-gray-600 bg-gray-700 text-white'
                      : 'border-gray-300 bg-white'
                  } focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md`}
                  value={completionFilter}
                  onChange={(e) => setCompletionFilter(e.target.value)}
                >
                  <option value="all">All Bookings</option>
                  <option value="completed">With Proof</option>
                  <option value="pending">Pending Proof</option>
                </select>
              </div>
              <div className="md:col-span-4 flex space-x-2 justify-end">
                <button
                  className={`inline-flex items-center px-4 py-2 border ${
                    darkMode
                      ? 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  } text-sm font-medium rounded-md`}
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
          <>
            {/* Bulk Actions Toolbar */}
            {selectedBookings.size > 0 && (
              <div className={`${darkMode ? 'bg-blue-900/50 border-blue-700' : 'bg-blue-50 border-blue-200'} border rounded-lg p-4 mb-4 flex flex-wrap items-center justify-between gap-4`}>
                <div className="flex items-center gap-3">
                  <span className={`font-medium ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                    {selectedBookings.size} booking(s) selected
                  </span>
                  <button
                    onClick={clearSelection}
                    className={`text-sm ${darkMode ? 'text-blue-300 hover:text-blue-100' : 'text-blue-600 hover:text-blue-800'}`}
                  >
                    Clear selection
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        bulkUpdateStatus(e.target.value)
                        e.target.value = ''
                      }
                    }}
                    disabled={bulkActionLoading}
                    className={`px-3 py-2 text-sm border rounded-md ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-200'
                        : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    <option value="">Change Status...</option>
                    <option value="pending">Set to Pending</option>
                    <option value="confirmed">Set to Confirmed</option>
                    <option value="cancelled">Set to Cancelled</option>
                  </select>
                  <button
                    onClick={exportToCSV}
                    disabled={bulkActionLoading}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export CSV
                  </button>
                  <button
                    onClick={bulkDelete}
                    disabled={bulkActionLoading}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            )}

            {/* Export All & Mark All Read Buttons (when nothing selected) */}
            {selectedBookings.size === 0 && filteredBookings.length > 0 && (
              <div className="flex justify-between items-center mb-4">
                <div>
                  {unreadBookingCount > 0 && (
                    <button
                      onClick={markAllBookingsAsRead}
                      className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        darkMode
                          ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
                      }`}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark all as read ({unreadBookingCount})
                    </button>
                  )}
                </div>
                <button
                  onClick={exportToCSV}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    darkMode
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export All to CSV
                </button>
              </div>
            )}

            {/* Desktop Table View - Compact Layout */}
            <div className={`hidden lg:block ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md overflow-hidden`}>
              <div className="overflow-y-auto max-h-[calc(100vh-18rem)]">
                <table className={`w-full divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                <thead className={`sticky top-0 z-10 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <tr>
                    <th scope="col" className="px-2 py-3 w-10">
                      <button
                        onClick={toggleSelectAll}
                        className={`p-1 rounded hover:bg-opacity-20 ${darkMode ? 'hover:bg-gray-500' : 'hover:bg-gray-300'}`}
                      >
                        {selectedBookings.size === filteredBookings.length && filteredBookings.length > 0 ? (
                          <CheckSquare2 className={`h-4 w-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                        ) : (
                          <Square className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        )}
                      </button>
                    </th>
                    <th
                      scope="col"
                      className={`px-3 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-20`}
                    >
                      ID
                    </th>
                    <th
                      scope="col"
                      className={`px-3 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-32`}
                    >
                      Schedule
                    </th>
                    <th
                      scope="col"
                      className={`px-3 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}
                    >
                      Client Details
                    </th>
                    <th
                      scope="col"
                      className={`px-3 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-36`}
                    >
                      Purpose
                    </th>
                    <th
                      scope="col"
                      className={`px-3 py-3 text-center text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-28`}
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className={`px-3 py-3 text-center text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-24`}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`${darkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {paginatedBookings.length > 0 ? (
                    paginatedBookings.map((booking) => (
                      <tr key={booking._id} className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} ${selectedBookings.has(booking._id) ? (darkMode ? 'bg-blue-900/30' : 'bg-blue-50') : ''} ${isBookingUnread(booking._id) ? (darkMode ? 'bg-blue-900/10' : 'bg-blue-50/50') : ''}`}>
                        <td className="px-2 py-3 w-10 relative">
                          {isBookingUnread(booking._id) && (
                            <span className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" title="Unread" />
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleSelectBooking(booking._id)
                            }}
                            className={`p-1 rounded hover:bg-opacity-20 ${darkMode ? 'hover:bg-gray-500' : 'hover:bg-gray-300'}`}
                          >
                            {selectedBookings.has(booking._id) ? (
                              <CheckSquare2 className={`h-4 w-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                            ) : (
                              <Square className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            )}
                          </button>
                        </td>
                        <td className={`px-3 py-3 text-xs font-mono ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} title={booking._id}>
                          ...{booking._id.slice(-6)}
                        </td>
                        <td className={`px-3 py-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <div className="flex items-center gap-1">
                            <Calendar className={`h-3.5 w-3.5 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                            <span className="font-medium">{new Date(booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Clock className={`h-3.5 w-3.5 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                            <span className="text-xs">{booking.time}</span>
                          </div>
                          {booking.status === 'rescheduled' && (
                            <div className={`text-[10px] ${darkMode ? 'text-yellow-400' : 'text-yellow-600'} mt-0.5 italic`}>
                              Was: {new Date(booking.originalDate || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          )}
                        </td>
                        <td className={`px-3 py-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <div className="font-semibold truncate max-w-[200px]" title={booking.company}>{booking.company}</div>
                          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} truncate max-w-[200px]`} title={booking.contactName}>
                            {booking.contactName}
                          </div>
                          <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} truncate max-w-[200px]`} title={booking.contactEmail}>
                            {booking.contactEmail}
                          </div>
                        </td>
                        <td className={`px-3 py-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <span className="line-clamp-2" title={booking.purpose}>{booking.purpose}</span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            {getStatusBadge(booking.status)}
                            {rejectedProofMap[booking._id] && booking.status === 'confirmed' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <XCircle className="w-3 h-3 mr-1" />
                                Report Rejected
                              </span>
                            )}
                            {booking.isCompleted !== undefined && getCompletionBadge(booking.isCompleted)}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => viewBookingDetails(booking)}
                              className={`p-1.5 rounded-md ${darkMode ? 'hover:bg-gray-600 text-blue-400' : 'hover:bg-blue-50 text-blue-600'}`}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
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
                              className={`p-1.5 rounded-md ${darkMode ? 'hover:bg-gray-600 text-indigo-400' : 'hover:bg-indigo-50 text-indigo-600'}`}
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteBooking(booking._id)}
                              className={`p-1.5 rounded-md ${darkMode ? 'hover:bg-gray-600 text-red-400' : 'hover:bg-red-50 text-red-600'}`}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className={`px-3 py-8 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                      >
                        No bookings found matching your criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {/* Mobile Select All */}
              {filteredBookings.length > 0 && (
                <div className={`flex items-center justify-between ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg px-4 py-2 shadow-sm`}>
                  <button
                    onClick={toggleSelectAll}
                    className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    {selectedBookings.size === filteredBookings.length && filteredBookings.length > 0 ? (
                      <CheckSquare2 className={`h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    ) : (
                      <Square className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    )}
                    Select All
                  </button>
                  <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {filteredBookings.length} booking(s)
                  </span>
                </div>
              )}

              {paginatedBookings.length > 0 ? (
                paginatedBookings.map((booking) => (
                  <div
                    key={booking._id}
                    className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} ${selectedBookings.has(booking._id) ? (darkMode ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50') : ''} ${isBookingUnread(booking._id) && !selectedBookings.has(booking._id) ? (darkMode ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-blue-500') : ''} border rounded-lg p-4 shadow-sm relative`}
                  >
                    {isBookingUnread(booking._id) && (
                      <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-blue-500 rounded-full" title="Unread" />
                    )}
                    <div className="flex items-start justify-between mb-3">
                      <button
                        onClick={() => toggleSelectBooking(booking._id)}
                        className={`mr-3 p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                      >
                        {selectedBookings.has(booking._id) ? (
                          <CheckSquare2 className={`h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                        ) : (
                          <Square className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                            {new Date(booking.date).toLocaleDateString()}
                          </span>
                          <Clock className="h-4 w-4 text-blue-500 ml-2" />
                          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {booking.time}
                          </span>
                        </div>
                        <h3 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                          {booking.company}
                        </h3>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {booking.contactName}
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mb-2`}>
                          {booking.contactEmail}
                        </p>
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {booking.purpose}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(booking.status)}
                          {rejectedProofMap[booking._id] && booking.status === 'confirmed' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              Report Rejected
                            </span>
                          )}
                          {booking.isCompleted !== undefined && getCompletionBadge(booking.isCompleted)}
                        </div>
                      </div>
                    </div>
                    <div className={`flex gap-2 mt-3 pt-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <button
                        onClick={() => viewBookingDetails(booking)}
                        className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium"
                      >
                        View
                      </button>
                      <button
                        onClick={() => openEditModal(booking)}
                        className={`flex-1 px-3 py-2 text-sm ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} rounded-md transition font-medium`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteBooking(booking._id)}
                        className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-8 text-center`}>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No bookings found
                  </p>
                </div>
              )}
            </div>

            {/* Booking Pagination */}
            <Pagination
              currentPage={bookingPage}
              totalPages={bookingTotalPages}
              totalItems={filteredBookings.length}
              itemsPerPage={BOOKINGS_PER_PAGE}
              onPageChange={setBookingPage}
              darkMode={darkMode}
              itemLabel="bookings"
            />
          </>
        )}
        {viewMode === 'calendar' && (
          <CalendarView
            darkMode={darkMode}
            calendarEvents={calendarEvents}
            handleEventClick={handleEventClick}
            readBookingIds={readBookingIds}
          />
        )}
        {viewMode === 'users' && (
          <div className="space-y-6">
            <UserManagement darkMode={darkMode} />
            <BulkEmailPanel darkMode={darkMode} />
          </div>
        )}
        {viewMode === 'analytics' && (
          <AnalyticsDashboard darkMode={darkMode} />
        )}

        {/* Activity Logs View */}
        {viewMode === 'activityLogs' && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md overflow-hidden`}>
            {activityLogsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Loading activity logs...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Filter Section */}
                <div className={`p-4 border-b ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50'}`}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                        Resource Type
                      </label>
                      <select
                        className={`block w-full border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} rounded-md py-2 px-3 text-sm`}
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
                        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                          Product Category
                        </label>
                        <select
                          className={`block w-full border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} rounded-md py-2 px-3 text-sm`}
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
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                        Action
                      </label>
                      <input
                        type="text"
                        className={`block w-full border ${darkMode ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-500' : 'border-gray-300'} rounded-md py-2 px-3 text-sm`}
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

                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto overflow-y-auto max-h-[calc(100vh-20rem)]">
                  <table className={`min-w-full divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    <thead className={`sticky top-0 z-10 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                      <tr>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                          Timestamp
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                          User
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                          Action
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                          Resource
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                          Details
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                          IP Address
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`${darkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                      {activityLogs.length > 0 ? (
                        activityLogs.map((log) => (
                          <tr key={log._id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                              <div>{log.userName}</div>
                              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{log.userEmail}</div>
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                              {log.action}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {log.resourceType}
                              </span>
                              {log.resourceId && (
                                <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
                                  ID: {log.resourceId.substring(0, 8)}...
                                </div>
                              )}
                            </td>
                            <td className={`px-6 py-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'} max-w-md`}>
                              {log.details || <span className={`${darkMode ? 'text-gray-500' : 'text-gray-400'} italic`}>No details</span>}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              {log.ipAddress || '-'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className={`px-6 py-8 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            No activity logs found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden p-3 overflow-y-auto max-h-[calc(100vh-20rem)]">
                  {activityLogs.length > 0 ? (
                    <div className="space-y-3">
                      {activityLogs.map((log) => (
                        <div
                          key={log._id}
                          className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4 shadow-sm`}
                        >
                          <div className="space-y-2">
                            {/* Timestamp */}
                            <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                              {new Date(log.createdAt).toLocaleString()}
                            </div>

                            {/* User */}
                            <div>
                              <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {log.userName}
                              </p>
                              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {log.userEmail}
                              </p>
                            </div>

                            {/* Action & Resource */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                                {log.action}
                              </span>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {log.resourceType}
                              </span>
                            </div>

                            {/* Resource ID */}
                            {log.resourceId && (
                              <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} font-mono`}>
                                ID: {log.resourceId.substring(0, 8)}...
                              </div>
                            )}

                            {/* Details */}
                            {log.details ? (
                              <div className={`p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {log.details}
                                </p>
                              </div>
                            ) : (
                              <p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'} italic`}>
                                No details
                              </p>
                            )}

                            {/* IP Address */}
                            {log.ipAddress && (
                              <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                IP: {log.ipAddress}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        No activity logs found
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Reviews Management View */}
        {viewMode === 'reviews' && (
          <AdminReviewsManager darkMode={darkMode} />
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
                      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Total Interactions</p>
                            <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{reportsStats.totalInteractions}</p>
                          </div>
                          <Activity className="h-12 w-12 text-blue-600" />
                        </div>
                      </div>

                      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Active Users</p>
                            <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{reportsStats.totalUsers}</p>
                          </div>
                          <Users className="h-12 w-12 text-green-600" />
                        </div>
                      </div>

                      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Top Products</p>
                            <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{reportsStats.topProducts.length}</p>
                          </div>
                          <Star className="h-12 w-12 text-yellow-600" />
                        </div>
                      </div>

                      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Categories</p>
                            <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
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
                      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
                        <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Interactions by Type</h3>
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
                      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
                        <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
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
                    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md mb-8`}>
                      <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
                          <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                          Top Products by Engagement
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className={`min-w-full divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                          <thead className={darkMode ? 'bg-gray-900' : 'bg-gray-50'}>
                            <tr>
                              <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                                Rank
                              </th>
                              <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                                Product
                              </th>
                              <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                                Interactions
                              </th>
                              <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                                Total Weight
                              </th>
                            </tr>
                          </thead>
                          <tbody className={`${darkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}>
                            {reportsStats.topProducts.length > 0 ? (
                              reportsStats.topProducts.map((product, index) => (
                                <tr key={product.productId} className={`hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>#{index + 1}</span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{product.productName}</div>
                                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{product.productId}</div>
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
                    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md`}>
                      <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
                          <Clock className="h-5 w-5 mr-2 text-blue-600" />
                          Recent Interactions
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className={`min-w-full divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                          <thead className={darkMode ? 'bg-gray-900' : 'bg-gray-50'}>
                            <tr>
                              <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                                User
                              </th>
                              <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                                Type
                              </th>
                              <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                                Product
                              </th>
                              <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                                Category
                              </th>
                              <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                                Weight
                              </th>
                              <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                                Time
                              </th>
                            </tr>
                          </thead>
                          <tbody className={`${darkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}>
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

        {/* Reports View */}
        {viewMode === 'reports' && (
          <div className="space-y-6">
            <EnhancedReportsTab darkMode={darkMode} />
            <DataExportPanel darkMode={darkMode} />
          </div>
        )}

        {/* Dashboard Overview */}
        {viewMode === 'dashboard' && (
          <DashboardOverview
            darkMode={darkMode}
            onNavigate={(view) => setViewMode(view as any)}
          />
        )}

        {/* Products View */}
        {viewMode === 'products' && (
          <ProductManagement isInline={true} darkMode={darkMode} />
        )}

        {/* Quotations View */}
        {viewMode === 'quotations' && (
          <QuotationDashboard isInline={true} darkMode={darkMode} />
        )}

        {/* Settings View */}
        {viewMode === 'settings' && (
          <AdminSettings darkMode={darkMode} />
        )}


        {/* Rate Limits View */}
        {viewMode === 'rateLimits' && (
          <RateLimitDashboard darkMode={darkMode} />
        )}

        {/* Security View (Sessions & 2FA) */}
        {viewMode === 'security' && (
          <div className="space-y-6">
            <SessionManagement darkMode={darkMode} />
            <TwoFactorSetup darkMode={darkMode} />
            <AccountSettings darkMode={darkMode} />
          </div>
        )}

        {/* Chat Support View */}
        {viewMode === 'chat' && (
          <div className="h-[calc(100vh-5rem)]">
            <AdminChatDashboard embedded />
          </div>
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
            <div className={`inline-block align-bottom ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full`}>
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} px-4 pt-5 pb-4 sm:p-6 sm:pb-4`}>
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
                          {selectedBooking.assignedTechnician && (
                            <div className="flex items-center">
                              <UserCheck className="h-5 w-5 text-blue-500 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-gray-500">
                                  Assigned Technician
                                </div>
                                <div className="mt-1 text-sm text-gray-900 font-medium">
                                  {getTechnicianLabel(selectedBooking.assignedTechnician)}
                                </div>
                                {getTechnicianRealName(selectedBooking.assignedTechnician) && (
                                  <div className="text-xs text-gray-700">
                                    {getTechnicianRealName(selectedBooking.assignedTechnician)}
                                  </div>
                                )}
                                <div className="text-xs text-gray-500">
                                  {selectedBooking.assignedTechnician.email}
                                  {selectedBooking.assignedTechnician.phone && ` | ${selectedBooking.assignedTechnician.phone}`}
                                </div>
                                {isSuperAdmin && ['confirmed', 'in_progress'].includes(selectedBooking.status) && (
                                  <button
                                    type="button"
                                    className="mt-1 text-xs text-blue-600 hover:text-blue-800 underline"
                                    onClick={() => openReassignModal(selectedBooking)}
                                  >
                                    <ArrowRightLeft className="h-3 w-3 inline mr-1" />
                                    Reassign Technician
                                  </button>
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
                          {rejectedProofMap[selectedBooking._id] && selectedBooking.status === 'confirmed' && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <div className="flex items-start gap-2">
                                <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-semibold text-red-800">Completion Report Rejected</p>
                                  <p className="text-sm text-red-700 mt-1">
                                    {rejectedProofMap[selectedBooking._id].reviewFeedback || 'No feedback provided.'}
                                  </p>
                                  <p className="text-xs text-red-500 mt-2">
                                    Rejected by {rejectedProofMap[selectedBooking._id].reviewedByName || 'Superadmin'} on {new Date(rejectedProofMap[selectedBooking._id].reviewedAt || '').toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
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
                          {isSuperAdmin && (
                            <button
                              type="button"
                              className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:w-auto sm:text-sm"
                              onClick={() => openDispatchModal(selectedBooking)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Confirm & Dispatch
                            </button>
                          )}
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
                            {rejectedProofMap[selectedBooking._id] ? (
                              <button
                                type="button"
                                className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-orange-600 text-base font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:w-auto sm:text-sm"
                                onClick={() => openRevisionModal(selectedBooking)}
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Revise & Resubmit Report
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
                                onClick={() => openCompletionModal()}
                              >
                                <CheckSquare className="h-4 w-4 mr-2" />
                                Submit Completion Report
                              </button>
                            )}
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
                      {selectedBooking.status === 'pending_review' && isSuperAdmin && (
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-orange-600 text-base font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:w-auto sm:text-sm"
                          onClick={() => {
                            setIsDetailModalOpen(false)
                            openReviewModal(selectedBooking)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Review Report
                        </button>
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
            <div className={`inline-block align-bottom ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full`}>
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} px-4 pt-5 pb-4 sm:p-6 sm:pb-4`}>
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
            <div className={`inline-block align-bottom ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full`}>
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} px-4 pt-5 pb-4 sm:p-6 sm:pb-4`}>
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
      {/* Completion Proof Modal */}
      {isCompletionModalOpen && selectedBooking && (
        <CompletionProofModal
          isOpen={isCompletionModalOpen}
          onClose={() => {
            setIsCompletionModalOpen(false)
            setRevisionMode(false)
            setRevisionProof(null)
          }}
          onComplete={handleBookingCompleted}
          booking={selectedBooking}
          darkMode={darkMode}
          mode={revisionMode ? 'revise' : 'create'}
          existingProof={revisionProof || undefined}
          rejectionFeedback={revisionProof?.reviewFeedback}
        />
      )}
      {/* Completion Review Modal (superadmin) */}
      {isReviewModalOpen && selectedBooking && reviewProof && (
        <CompletionReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false)
            setReviewProof(null)
          }}
          onDecision={handleReviewDecision}
          booking={selectedBooking}
          proof={reviewProof}
          darkMode={darkMode}
        />
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
            <div className={`inline-block align-bottom ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full`}>
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} px-4 pt-5 pb-4 sm:p-6 sm:pb-4`}>
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

      {/* Past Bookings Warning - removed blocking modal, now inline banner */}

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

      {/* Bulk Completion Wizard */}
      <BulkCompletionWizard
        isOpen={showBulkCompletionWizard}
        onClose={() => setShowBulkCompletionWizard(false)}
        onComplete={handleBulkCompletionComplete}
        bookings={pastBookings}
        darkMode={darkMode}
      />

      {/* Dispatch Modal - Confirm & Assign Technician */}
      {isDispatchModalOpen && dispatchBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsDispatchModalOpen(false)} />
            <div className={`relative rounded-lg shadow-xl max-w-md w-full p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Confirm & Dispatch Technician
              </h3>
              <div className={`mb-4 p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <strong>{dispatchBooking.contactName}</strong> - {dispatchBooking.company}
                </p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {new Date(dispatchBooking.date).toLocaleDateString()} at {dispatchBooking.time} | {dispatchBooking.location}
                </p>
              </div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Select Technician <span className="text-red-500">*</span>
              </label>
              {techLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  <span className="ml-2 text-sm text-gray-500">Loading technicians...</span>
                </div>
              ) : availableTechnicians.length === 0 ? (
                <div className={`text-center py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No technicians found. Please assign the technician role to users first.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableTechnicians.map((tech) => (
                    <label
                      key={tech._id}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedTechnicianId === tech._id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="technician"
                        value={tech._id}
                        checked={selectedTechnicianId === tech._id}
                        onChange={() => setSelectedTechnicianId(tech._id)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {getTechnicianLabel(tech)}
                        </div>
                        {getTechnicianRealName(tech) && (
                          <div className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {getTechnicianRealName(tech)}
                          </div>
                        )}
                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {tech.email}
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        tech.isAvailable
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {tech.isAvailable ? 'Available' : 'Busy'}
                      </span>
                    </label>
                  ))}
                </div>
              )}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-medium rounded-md ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  onClick={() => setIsDispatchModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                  disabled={!selectedTechnicianId || dispatchLoading}
                  onClick={handleConfirmAndDispatch}
                >
                  {dispatchLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin inline mr-1" /> Dispatching...</>
                  ) : (
                    <><CheckCircle className="h-4 w-4 inline mr-1" /> Confirm & Dispatch</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Technician Modal */}
      {isReassignModalOpen && reassignBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsReassignModalOpen(false)} />
            <div className={`relative rounded-lg shadow-xl max-w-md w-full p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Reassign Technician
              </h3>
              <div className={`mb-4 p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <strong>{reassignBooking.contactName}</strong> - {reassignBooking.company}
                </p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Currently assigned to: <strong>{reassignBooking.assignedTechnician && typeof reassignBooking.assignedTechnician === 'object' ? getTechnicianLabel(reassignBooking.assignedTechnician) : 'Unknown'}</strong>
                </p>
              </div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Select New Technician <span className="text-red-500">*</span>
              </label>
              {techLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  <span className="ml-2 text-sm text-gray-500">Loading technicians...</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableTechnicians.map((tech) => (
                    <label
                      key={tech._id}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedTechnicianId === tech._id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reassign-technician"
                        value={tech._id}
                        checked={selectedTechnicianId === tech._id}
                        onChange={() => setSelectedTechnicianId(tech._id)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {getTechnicianLabel(tech)}
                        </div>
                        {getTechnicianRealName(tech) && (
                          <div className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {getTechnicianRealName(tech)}
                          </div>
                        )}
                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {tech.email}
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        tech.isAvailable
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {tech.isAvailable ? 'Available' : 'Busy'}
                      </span>
                    </label>
                  ))}
                </div>
              )}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-medium rounded-md ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  onClick={() => setIsReassignModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={!selectedTechnicianId || dispatchLoading}
                  onClick={handleReassignTechnician}
                >
                  {dispatchLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin inline mr-1" /> Reassigning...</>
                  ) : (
                    <><ArrowRightLeft className="h-4 w-4 inline mr-1" /> Reassign</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  </div>
  )
}

