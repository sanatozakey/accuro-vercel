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
  ExternalLink,
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
}

interface QuotationContext {
  _id: string
  quotationNumber: string
  status: string
  totalAmount?: number
  createdAt: string
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

export function ChatSuggestionPanel({
  conversationId,
  messages,
  onSendReply,
}: ChatSuggestionPanelProps) {
  const [context, setContext] = useState<ChatContextData | null>(null)
  const [contextLoading, setContextLoading] = useState(false)

  // Fetch user context when conversationId changes
  useEffect(() => {
    if (!conversationId) return

    let cancelled = false
    setContextLoading(true)

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

  const formatAmount = (amount?: number) => {
    if (amount == null) return 'N/A'
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount)
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
                </div>
                {context.bookings.length > 0 ? (
                  <div className="space-y-1">
                    {context.bookings.map((booking) => (
                      <a
                        key={booking._id}
                        href="/admin/bookings"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] text-gray-900 dark:text-white truncate">
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
                          <ExternalLink
                            size={10}
                            className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        </div>
                      </a>
                    ))}
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
                </div>
                {context.quotations.length > 0 ? (
                  <div className="space-y-1">
                    {context.quotations.map((quote) => (
                      <a
                        key={quote._id}
                        href="/admin/quotations"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] text-gray-900 dark:text-white truncate">
                            {quote.quotationNumber}
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">
                            {formatAmount(quote.totalAmount)}
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
                          <ExternalLink
                            size={10}
                            className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        </div>
                      </a>
                    ))}
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
