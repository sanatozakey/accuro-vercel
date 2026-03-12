import React, { useState, useEffect, useMemo } from 'react'
import api from '../services/api'
import { detectIntents, ChatIntent } from '../utils/chatIntentDetector'
import {
  Calendar,
  FileText,
  MessageSquare,
  AlertCircle,
  ShoppingCart,
  HelpCircle,
  Smile,
  Frown,
  Brain,
  Loader,
  ChevronDown,
  ChevronUp,
  MapPin,
  Briefcase,
  Phone,
  Mail,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Send,
} from 'lucide-react'

interface Message {
  _id: string
  conversationId: string
  senderId: string
  senderRole: string
  senderName: string
  message: string
  isRead: boolean
  createdAt: string
}

interface BookingContext {
  _id: string
  date: string
  time: string
  status: string
  company: string
  product: string
  location: string
  purpose?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  additionalInfo?: string
}

interface QuotationItem {
  productName: string
  quantity: number
  specifications?: string
}

interface QuotationContext {
  _id: string
  quotationNumber: string
  status: string
  totalAmount?: number
  currency?: string
  items?: QuotationItem[]
  createdAt: string
  validUntil?: string
}

interface UserContext {
  _id: string
  name: string
  email: string
  phone?: string
  company?: string
  createdAt: string
}

interface ChatContextData {
  user: UserContext | null
  bookings: BookingContext[]
  quotations: QuotationContext[]
}

interface ChatSuggestionPanelProps {
  conversationId: string
  messages: Message[]
  onSendReply: (text: string) => void
}

const ICON_MAP: Record<string, React.FC<{ size?: number; className?: string }>> = {
  Calendar,
  FileText,
  MessageSquare,
  AlertCircle,
  ShoppingCart,
  HelpCircle,
  Smile,
  Frown,
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  rescheduled: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  pending_review: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  expired: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

const STATUS_ICONS: Record<string, React.FC<{ size?: number; className?: string }>> = {
  pending: Clock,
  confirmed: CheckCircle,
  completed: CheckCircle,
  cancelled: XCircle,
  approved: CheckCircle,
  rejected: XCircle,
}

export function ChatSuggestionPanel({
  conversationId,
  messages,
  onSendReply,
}: ChatSuggestionPanelProps) {
  const [context, setContext] = useState<ChatContextData | null>(null)
  const [contextLoading, setContextLoading] = useState(false)
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null)
  const [expandedQuotation, setExpandedQuotation] = useState<string | null>(null)

  // Fetch user context when conversationId changes
  useEffect(() => {
    if (!conversationId) return

    let cancelled = false
    setContextLoading(true)
    setExpandedBooking(null)
    setExpandedQuotation(null)

    api
      .get(`/chat/conversations/${conversationId}/context`)
      .then((res) => {
        if (!cancelled && res.data.success) {
          setContext(res.data.data)
        }
      })
      .catch((err) => {
        console.error('Failed to load chat context:', err)
      })
      .finally(() => {
        if (!cancelled) setContextLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [conversationId])

  // Detect intents from messages
  const intents = useMemo(() => {
    return detectIntents(messages)
  }, [messages])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatAmount = (amount?: number, currency?: string) => {
    if (amount == null) return 'N/A'
    const symbol = currency === 'USD' ? '$' : '₱'
    return `${symbol}${amount.toLocaleString()}`
  }

  const handleBookingClick = (booking: BookingContext) => {
    if (expandedBooking === booking._id) {
      setExpandedBooking(null)
      return
    }
    setExpandedBooking(booking._id)
    setExpandedQuotation(null)

    // Auto-send a formatted booking details message
    const details = [
      `📋 Booking Details for ${context?.user?.name || 'Customer'}:`,
      `• Date: ${formatDate(booking.date)} at ${booking.time}`,
      `• Status: ${booking.status.replace('_', ' ').toUpperCase()}`,
      booking.purpose ? `• Purpose: ${booking.purpose}` : null,
      booking.company ? `• Company: ${booking.company}` : null,
      booking.location ? `• Location: ${booking.location}` : null,
      booking.product ? `• Product: ${booking.product}` : null,
      booking.contactName ? `• Contact: ${booking.contactName}` : null,
    ]
      .filter(Boolean)
      .join('\n')

    onSendReply(details)
  }

  const handleQuotationClick = (quote: QuotationContext) => {
    if (expandedQuotation === quote._id) {
      setExpandedQuotation(null)
      return
    }
    setExpandedQuotation(quote._id)
    setExpandedBooking(null)

    // Auto-send a formatted quotation details message
    const itemsList = quote.items && quote.items.length > 0
      ? quote.items.map((item, i) => `  ${i + 1}. ${item.productName} (Qty: ${item.quantity})`).join('\n')
      : null

    const details = [
      `📄 Quotation Details - ${quote.quotationNumber}:`,
      `• Status: ${quote.status.toUpperCase()}`,
      quote.totalAmount != null ? `• Total: ${formatAmount(quote.totalAmount, quote.currency)}` : null,
      `• Requested: ${formatDate(quote.createdAt)}`,
      quote.validUntil ? `• Valid Until: ${formatDate(quote.validUntil)}` : null,
      itemsList ? `• Items:\n${itemsList}` : null,
    ]
      .filter(Boolean)
      .join('\n')

    onSendReply(details)
  }

  return (
    <div className="w-72 lg:w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col overflow-hidden flex-shrink-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 flex-shrink-0">
        <Brain size={18} className="text-purple-500" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Smart Suggestions</h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Intent Cards Section */}
        <div className="p-3 space-y-2">
          {intents.length > 0 ? (
            intents.map((intent) => {
              const IconComp = ICON_MAP[intent.icon] || MessageSquare
              return (
                <div
                  key={intent.type}
                  className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 p-3"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <IconComp size={14} className="text-purple-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                      {intent.label}
                    </span>
                    <span className="ml-auto text-[10px] text-gray-400 flex-shrink-0">
                      {Math.round(intent.confidence * 100)}%
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {intent.suggestedReplies.map((reply, idx) => (
                      <button
                        key={idx}
                        onClick={() => onSendReply(reply)}
                        className="w-full text-left text-xs px-2.5 py-2 rounded-md bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-500 transition-colors line-clamp-2"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-4">
              <MessageSquare size={20} className="mx-auto text-gray-300 dark:text-gray-600 mb-1" />
              <p className="text-xs text-gray-400 dark:text-gray-500">
                No intents detected yet. Suggestions will appear as the customer sends messages.
              </p>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700" />

        {/* Customer Context Section */}
        <div className="p-3">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={14} className="text-blue-500" />
            <h4 className="text-xs font-semibold text-gray-900 dark:text-white">Customer Context</h4>
          </div>

          {contextLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader className="animate-spin text-blue-500" size={18} />
            </div>
          ) : context ? (
            <div className="space-y-3">
              {/* User Profile */}
              {context.user && (
                <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 p-2.5">
                  <p className="text-xs font-medium text-gray-900 dark:text-white">
                    {context.user.name}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">{context.user.email}</p>
                  {context.user.phone && (
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">{context.user.phone}</p>
                  )}
                  {context.user.company && (
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">{context.user.company}</p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">
                    Member since {formatDate(context.user.createdAt)}
                  </p>
                </div>
              )}

              {/* Recent Bookings */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Calendar size={12} className="text-blue-500" />
                  <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
                    Recent Bookings
                  </span>
                  <span className="text-[9px] text-gray-400 ml-auto">Click to share in chat</span>
                </div>
                {context.bookings.length > 0 ? (
                  <div className="space-y-1">
                    {context.bookings.map((booking) => {
                      const isExpanded = expandedBooking === booking._id
                      const StatusIcon = STATUS_ICONS[booking.status] || Clock
                      return (
                        <div key={booking._id} className="rounded-md border border-gray-200 dark:border-gray-600 overflow-hidden">
                          <button
                            onClick={() => handleBookingClick(booking)}
                            className={`w-full flex items-center justify-between px-2.5 py-2 text-left transition-colors ${
                              isExpanded
                                ? 'bg-blue-50 dark:bg-blue-900/30 border-b border-gray-200 dark:border-gray-600'
                                : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-medium text-gray-900 dark:text-white truncate">
                                {formatDate(booking.date)}
                                {booking.time && ` at ${booking.time}`}
                              </p>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                {booking.company || booking.product || booking.location || 'No details'}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                              <span
                                className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                                  STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {booking.status.replace('_', ' ')}
                              </span>
                              {isExpanded ? (
                                <ChevronUp size={12} className="text-gray-400" />
                              ) : (
                                <ChevronDown size={12} className="text-gray-400" />
                              )}
                            </div>
                          </button>

                          {/* Expanded Booking Details */}
                          {isExpanded && (
                            <div className="px-2.5 py-2 bg-white dark:bg-gray-700 space-y-1.5">
                              <div className="flex items-center gap-1 text-[10px]">
                                <StatusIcon size={10} className="text-blue-500 flex-shrink-0" />
                                <span className="text-gray-500 dark:text-gray-400">Status:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{booking.status.replace('_', ' ').toUpperCase()}</span>
                              </div>
                              {booking.purpose && (
                                <div className="flex items-start gap-1 text-[10px]">
                                  <Briefcase size={10} className="text-blue-500 flex-shrink-0 mt-0.5" />
                                  <span className="text-gray-500 dark:text-gray-400">Purpose:</span>
                                  <span className="text-gray-900 dark:text-white">{booking.purpose}</span>
                                </div>
                              )}
                              {booking.company && (
                                <div className="flex items-center gap-1 text-[10px]">
                                  <Briefcase size={10} className="text-blue-500 flex-shrink-0" />
                                  <span className="text-gray-500 dark:text-gray-400">Company:</span>
                                  <span className="text-gray-900 dark:text-white">{booking.company}</span>
                                </div>
                              )}
                              {booking.location && (
                                <div className="flex items-center gap-1 text-[10px]">
                                  <MapPin size={10} className="text-blue-500 flex-shrink-0" />
                                  <span className="text-gray-500 dark:text-gray-400">Location:</span>
                                  <span className="text-gray-900 dark:text-white">{booking.location}</span>
                                </div>
                              )}
                              {booking.product && (
                                <div className="flex items-center gap-1 text-[10px]">
                                  <ShoppingCart size={10} className="text-blue-500 flex-shrink-0" />
                                  <span className="text-gray-500 dark:text-gray-400">Product:</span>
                                  <span className="text-gray-900 dark:text-white">{booking.product}</span>
                                </div>
                              )}
                              {booking.contactName && (
                                <div className="flex items-center gap-1 text-[10px]">
                                  <User size={10} className="text-blue-500 flex-shrink-0" />
                                  <span className="text-gray-500 dark:text-gray-400">Contact:</span>
                                  <span className="text-gray-900 dark:text-white">{booking.contactName}</span>
                                </div>
                              )}
                              {booking.contactEmail && (
                                <div className="flex items-center gap-1 text-[10px]">
                                  <Mail size={10} className="text-blue-500 flex-shrink-0" />
                                  <span className="text-gray-900 dark:text-white">{booking.contactEmail}</span>
                                </div>
                              )}
                              {booking.contactPhone && (
                                <div className="flex items-center gap-1 text-[10px]">
                                  <Phone size={10} className="text-blue-500 flex-shrink-0" />
                                  <span className="text-gray-900 dark:text-white">{booking.contactPhone}</span>
                                </div>
                              )}
                              {booking.additionalInfo && (
                                <div className="text-[10px] mt-1 pt-1 border-t border-gray-100 dark:border-gray-600">
                                  <span className="text-gray-500 dark:text-gray-400">Notes: </span>
                                  <span className="text-gray-900 dark:text-white">{booking.additionalInfo}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1 pt-1 text-[9px] text-green-600 dark:text-green-400">
                                <Send size={8} />
                                <span>Details pre-filled in input</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 px-2">No bookings found</p>
                )}
              </div>

              {/* Quotations */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <FileText size={12} className="text-green-500" />
                  <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
                    Quotations
                  </span>
                  <span className="text-[9px] text-gray-400 ml-auto">Click to share in chat</span>
                </div>
                {context.quotations.length > 0 ? (
                  <div className="space-y-1">
                    {context.quotations.map((quote) => {
                      const isExpanded = expandedQuotation === quote._id
                      const StatusIcon = STATUS_ICONS[quote.status] || Clock
                      return (
                        <div key={quote._id} className="rounded-md border border-gray-200 dark:border-gray-600 overflow-hidden">
                          <button
                            onClick={() => handleQuotationClick(quote)}
                            className={`w-full flex items-center justify-between px-2.5 py-2 text-left transition-colors ${
                              isExpanded
                                ? 'bg-green-50 dark:bg-green-900/30 border-b border-gray-200 dark:border-gray-600'
                                : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-green-50 dark:hover:bg-green-900/20'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-medium text-gray-900 dark:text-white truncate">
                                {quote.quotationNumber}
                              </p>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                {formatAmount(quote.totalAmount, quote.currency)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                              <span
                                className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                                  STATUS_COLORS[quote.status] || 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {quote.status}
                              </span>
                              {isExpanded ? (
                                <ChevronUp size={12} className="text-gray-400" />
                              ) : (
                                <ChevronDown size={12} className="text-gray-400" />
                              )}
                            </div>
                          </button>

                          {/* Expanded Quotation Details */}
                          {isExpanded && (
                            <div className="px-2.5 py-2 bg-white dark:bg-gray-700 space-y-1.5">
                              <div className="flex items-center gap-1 text-[10px]">
                                <StatusIcon size={10} className="text-green-500 flex-shrink-0" />
                                <span className="text-gray-500 dark:text-gray-400">Status:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{quote.status.toUpperCase()}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[10px]">
                                <Calendar size={10} className="text-green-500 flex-shrink-0" />
                                <span className="text-gray-500 dark:text-gray-400">Requested:</span>
                                <span className="text-gray-900 dark:text-white">{formatDate(quote.createdAt)}</span>
                              </div>
                              {quote.totalAmount != null && (
                                <div className="flex items-center gap-1 text-[10px]">
                                  <span className="text-gray-500 dark:text-gray-400 ml-3">Total:</span>
                                  <span className="font-semibold text-green-600 dark:text-green-400">
                                    {formatAmount(quote.totalAmount, quote.currency)}
                                  </span>
                                </div>
                              )}
                              {quote.validUntil && (
                                <div className="flex items-center gap-1 text-[10px]">
                                  <Clock size={10} className="text-green-500 flex-shrink-0" />
                                  <span className="text-gray-500 dark:text-gray-400">Valid Until:</span>
                                  <span className="text-gray-900 dark:text-white">{formatDate(quote.validUntil)}</span>
                                </div>
                              )}
                              {quote.items && quote.items.length > 0 && (
                                <div className="text-[10px] mt-1 pt-1 border-t border-gray-100 dark:border-gray-600">
                                  <p className="text-gray-500 dark:text-gray-400 mb-1">Items:</p>
                                  <div className="space-y-0.5 pl-2">
                                    {quote.items.map((item, idx) => (
                                      <div key={idx} className="text-gray-900 dark:text-white">
                                        {idx + 1}. {item.productName} <span className="text-gray-400">(Qty: {item.quantity})</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div className="flex items-center gap-1 pt-1 text-[9px] text-green-600 dark:text-green-400">
                                <Send size={8} />
                                <span>Details pre-filled in input</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 px-2">No quotations found</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">
              Unable to load customer context.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatSuggestionPanel
