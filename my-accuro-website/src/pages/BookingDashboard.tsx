import React, { useEffect, useState, cloneElement } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Filter,
  RefreshCw,
  Download,
  Edit,
  Trash2,
  Plus,
  Save,
  CalendarDays,
  List,
  RotateCcw,
  CheckSquare,
  ClipboardList,
} from 'lucide-react'
// Define types for our booking data
interface Booking {
  id: string
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
// Mock data for bookings
const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'BK-001',
    date: '2023-11-15',
    time: '10:00',
    company: 'Petrotech Industries',
    contactName: 'Maria Santos',
    contactEmail: 'maria@petrotech.com',
    contactPhone: '+63 917 123 4567',
    purpose: 'Product Demonstration',
    location: 'Accuro Office',
    product: 'Beamex Calibrators',
    additionalInfo: 'Interested in MC6 models for their new plant.',
    status: 'confirmed',
    createdAt: '2023-11-10T08:23:15Z',
    isCompleted: true,
    conclusion:
      'Client is interested in purchasing 5 MC6 units. Follow-up with quotation.',
  },
  {
    id: 'BK-002',
    date: '2023-11-16',
    time: '14:30',
    company: 'Manila Power Corp',
    contactName: 'Juan Reyes',
    contactEmail: 'jreyes@mpc.com',
    contactPhone: '+63 918 765 4321',
    purpose: 'Technical Consultation',
    location: 'Client Site',
    product: 'Beamex Calibration Software',
    additionalInfo: 'Need help integrating with their existing systems.',
    status: 'pending',
    createdAt: '2023-11-11T14:05:22Z',
    isCompleted: false,
  },
  {
    id: 'BK-003',
    date: '2023-11-17',
    time: '09:00',
    company: 'Visayas Manufacturing',
    contactName: 'Ana Lim',
    contactEmail: 'alim@visayasmfg.com',
    contactPhone: '+63 919 222 3333',
    purpose: 'Calibration Services',
    location: 'Virtual Meeting',
    product: 'Beamex Integrated Solutions',
    additionalInfo: 'Looking for a complete solution for their new factory.',
    status: 'cancelled',
    createdAt: '2023-11-09T10:15:45Z',
    isCompleted: false,
  },
  {
    id: 'BK-004',
    date: '2023-11-18',
    time: '11:00',
    company: 'Mindanao Energy',
    contactName: 'Roberto Cruz',
    contactEmail: 'rcruz@mindanaoE.com',
    contactPhone: '+63 920 111 2222',
    purpose: 'Product Demonstration',
    location: 'Accuro Office',
    product: 'Beamex Temperature Measurement',
    additionalInfo:
      'Need precise temperature calibration for their power plant.',
    status: 'confirmed',
    createdAt: '2023-11-12T09:30:10Z',
    isCompleted: false,
  },
  {
    id: 'BK-005',
    date: '2023-11-20',
    time: '15:00',
    company: 'Cebu Electronics',
    contactName: 'Patricia Tan',
    contactEmail: 'ptan@cebuelectronics.com',
    contactPhone: '+63 921 333 4444',
    purpose: 'Software Training',
    location: 'Virtual Meeting',
    product: 'Beamex Calibration Software',
    additionalInfo: 'Need training for 5 staff members on CMX software.',
    status: 'pending',
    createdAt: '2023-11-13T16:45:30Z',
    isCompleted: false,
  },
  {
    id: 'BK-006',
    date: '2023-11-25',
    time: '13:00',
    company: 'Davao Industrial',
    contactName: 'Miguel Lopez',
    contactEmail: 'mlopez@davaoindustrial.com',
    contactPhone: '+63 922 444 5555',
    purpose: 'Technical Consultation',
    location: 'Virtual Meeting',
    product: 'Beamex Pressure Measurement',
    additionalInfo: 'Experiencing issues with current pressure calibrators.',
    status: 'rescheduled',
    createdAt: '2023-11-14T11:20:15Z',
    originalDate: '2023-11-22',
    originalTime: '10:00',
    rescheduleReason:
      'Client requested postponement due to conflicting schedule.',
    isCompleted: false,
  },
  {
    id: 'BK-007',
    date: '2023-11-10',
    time: '09:30',
    company: 'Batangas Refinery',
    contactName: 'Elena Reyes',
    contactEmail: 'ereyes@batangasref.com',
    contactPhone: '+63 923 555 6666',
    purpose: 'Product Demonstration',
    location: 'Accuro Office',
    product: 'Beamex Calibrators',
    additionalInfo: 'Interested in upgrading their calibration equipment.',
    status: 'confirmed',
    createdAt: '2023-11-05T09:15:30Z',
    isCompleted: true,
    conclusion:
      'Client will submit purchase request for approval. Expect order within 2 weeks.',
  },
]
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
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [loginError, setLoginError] = useState<string>('')
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS)
  const [filteredBookings, setFilteredBookings] =
    useState<Booking[]>(MOCK_BOOKINGS)
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
  const [viewMode, setViewMode] = useState<'table' | 'calendar' | 'logs'>(
    'table',
  )
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
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
  // Simple mock authentication
  const handleLogin = (e: React.FormEvent): void => {
    e.preventDefault()
    // In a real app, this would validate against a backend
    if (username === 'admin' && password === 'accuro123') {
      setIsAuthenticated(true)
      setLoginError('')
      localStorage.setItem('accuro_dashboard_auth', 'true')
    } else {
      setLoginError('Invalid credentials. Please try again.')
    }
  }
  // Check if user is already logged in
  useEffect(() => {
    const authStatus = localStorage.getItem('accuro_dashboard_auth')
    if (authStatus === 'true') {
      setIsAuthenticated(true)
    }
  }, [])
  // Handle logout
  const handleLogout = (): void => {
    setIsAuthenticated(false)
    localStorage.removeItem('accuro_dashboard_auth')
  }
  // Create calendar events from bookings
  useEffect(() => {
    const events = bookings.map((booking): CalendarEvent => {
      // Parse date and time to create start time
      const [year, month, day] = booking.date.split('-').map(Number)
      const [hours, minutes] = booking.time.split(':').map(Number)
      // Create date object for start time
      const startDate = new Date(year, month - 1, day, hours, minutes)
      // Create date object for end time (assuming 1 hour meetings)
      const endDate = new Date(startDate)
      endDate.setHours(endDate.getHours() + 1)
      // Determine color based on status
      let backgroundColor = '#3788d8' // default blue
      if (booking.status === 'confirmed') backgroundColor = '#10b981' // green
      if (booking.status === 'cancelled') backgroundColor = '#ef4444' // red
      if (booking.status === 'pending') backgroundColor = '#f59e0b' // amber
      if (booking.status === 'rescheduled') backgroundColor = '#8b5cf6' // purple
      return {
        id: booking.id,
        title: `${booking.company} - ${booking.purpose}`,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        backgroundColor,
        borderColor: backgroundColor,
        extendedProps: {
          booking,
        },
      }
    })
    setCalendarEvents(events)
  }, [bookings])
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
          booking.id.toLowerCase().includes(searchTerm.toLowerCase()),
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
  const updateBookingStatus = (id: string, newStatus: string): void => {
    const updatedBookings = bookings.map((booking) => {
      if (booking.id === id) {
        return {
          ...booking,
          status: newStatus,
        }
      }
      return booking
    })
    setBookings(updatedBookings)
    // Close detail modal if open
    if (isDetailModalOpen && selectedBooking && selectedBooking.id === id) {
      setSelectedBooking({
        ...selectedBooking,
        status: newStatus,
      })
    }
  }
  // Handle completion status change
  const markBookingAsCompleted = (id: string, conclusion: string): void => {
    const updatedBookings = bookings.map((booking) => {
      if (booking.id === id) {
        return {
          ...booking,
          isCompleted: true,
          conclusion,
        }
      }
      return booking
    })
    setBookings(updatedBookings)
    setIsCompletionModalOpen(false)
    // Update selected booking if open
    if (isDetailModalOpen && selectedBooking && selectedBooking.id === id) {
      setSelectedBooking({
        ...selectedBooking,
        isCompleted: true,
        conclusion,
      })
    }
  }
  // Handle reschedule
  const rescheduleBooking = (): void => {
    if (!editedBooking) return
    const updatedBookings = bookings.map((booking) => {
      if (booking.id === editedBooking.id) {
        return {
          ...editedBooking,
          status: 'rescheduled',
          originalDate:
            selectedBooking?.originalDate || selectedBooking?.date || '',
          originalTime:
            selectedBooking?.originalTime || selectedBooking?.time || '',
          rescheduleReason,
        }
      }
      return booking
    })
    setBookings(updatedBookings)
    if (selectedBooking) {
      setSelectedBooking({
        ...editedBooking,
        status: 'rescheduled',
        originalDate: selectedBooking.originalDate || selectedBooking.date,
        originalTime: selectedBooking.originalTime || selectedBooking.time,
        rescheduleReason,
      })
    }
    setIsRescheduleModalOpen(false)
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
  const saveEditedBooking = (): void => {
    if (!editedBooking) return
    // Validate form
    const errors = validateBookingForm(editedBooking)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    // Clear any previous errors
    setFormErrors({})
    const updatedBookings = bookings.map((booking) => {
      if (booking.id === editedBooking.id) {
        return editedBooking
      }
      return booking
    })
    setBookings(updatedBookings)
    setSelectedBooking(editedBooking)
    setIsEditMode(false)
  }
  // Delete booking
  const deleteBooking = (id: string): void => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      const updatedBookings = bookings.filter((booking) => booking.id !== id)
      setBookings(updatedBookings)
      if (isDetailModalOpen) {
        setIsDetailModalOpen(false)
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
  const createNewBooking = (): void => {
    // Validate form
    const errors = validateBookingForm(newBooking)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    // Clear any previous errors
    setFormErrors({})
    // Generate a new booking ID
    const newId = `BK-${String(bookings.length + 1).padStart(3, '0')}`
    const bookingToAdd: Booking = {
      ...newBooking,
      id: newId,
      createdAt: new Date().toISOString(),
    }
    setBookings([bookingToAdd, ...bookings])
    setIsCreateModalOpen(false)
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
  // Format date for display
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
    return new Date(dateString).toLocaleDateString(undefined, options)
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
  // If not authenticated, show login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <img
            src="https://uploadthingy.s3.us-west-1.amazonaws.com/hm7mtaNdbWyZ81qScpSM5S/accuro_logo.png"
            alt="Accuro Logo"
            className="mx-auto h-16"
          />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Booking Dashboard
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Authorized personnel only
          </p>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleLogin}>
              {loginError && (
                <div
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
                  role="alert"
                >
                  <span className="block sm:inline">{loginError}</span>
                </div>
              )}
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700"
                >
                  Username
                </label>
                <div className="mt-1">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Sign in
                </button>
              </div>
            </form>
            <div className="mt-6">
              <div className="relative">
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    For demo purposes, use: admin / accuro123
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
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
                Meeting Bookings Dashboard
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-8">
        {/* View Toggles */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex space-x-2">
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
          </div>
        </div>
        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4.5 w-4.5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search by company or contact"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Filter className="h-5 w-5 text-gray-400 inline mr-2" />
                <select
                  className="w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="rescheduled">Rescheduled</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              {viewMode === 'logs' && (
                <div className="flex-1">
                  <CheckSquare className="h-5 w-5 text-gray-400 inline mr-2" />
                  <select
                    className="w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={completionFilter}
                    onChange={(e) => setCompletionFilter(e.target.value)}
                  >
                    <option value="all">All Meetings</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending Completion</option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex space-x-2 justify-end">
              <button
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                onClick={() => setBookings(MOCK_BOOKINGS)}
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
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {booking.id}
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
                              onClick={() => deleteBooking(booking.id)}
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
              aspectRatio={1.5}
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
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {booking.id}
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
                        {selectedBooking.id}
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
                              ID: {editedBooking.id}
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
                            <div className="text-sm font-medium text-gray-500 mb-1">
                              Additional Information
                            </div>
                            <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
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
                              <div className="text-sm font-medium text-gray-500 mb-1">
                                Meeting Conclusion
                              </div>
                              <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
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
                                selectedBooking.id,
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
                                selectedBooking.id,
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
                    markBookingAsCompleted(selectedBooking.id, conclusion)
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
    </div>
  )
}
