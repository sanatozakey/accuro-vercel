import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import api from '../services/api'
import {
  MessageCircle,
  Send,
  User,
  Clock,
  ChevronLeft,
  Search,
  Circle,
  XCircle,
  Loader,
  Inbox,
} from 'lucide-react'

interface Conversation {
  _id: string
  userId: {
    _id: string
    name: string
    email: string
    profilePicture?: string
  }
  status: 'active' | 'closed'
  lastMessage: string
  lastMessageAt: string
  unreadByAdmin: number
  createdAt: string
}

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

export function AdminChatDashboard() {
  const { user, logout } = useAuth()
  const { socket, isConnected } = useSocket()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/chat/conversations')
      if (res.data.success) {
        setConversations(res.data.data)
      }
    } catch (err) {
      console.error('Failed to load conversations:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Listen for real-time messages
  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (data: { message: Message; conversation: any }) => {
      // Update conversation list
      setConversations(prev => {
        const updated = prev.map(c => {
          if (c._id === data.message.conversationId) {
            return {
              ...c,
              lastMessage: data.message.message,
              lastMessageAt: data.message.createdAt,
              unreadByAdmin: selectedConversation?._id === c._id ? c.unreadByAdmin : c.unreadByAdmin + 1,
            }
          }
          return c
        })
        // Sort by most recent
        updated.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())

        // If this is a new conversation not in the list, refetch
        if (!updated.find(c => c._id === data.message.conversationId)) {
          fetchConversations()
        }

        return updated
      })

      // Add message to current conversation
      if (selectedConversation && data.message.conversationId === selectedConversation._id) {
        setMessages(prev => {
          if (prev.find(m => m._id === data.message._id)) return prev
          return [...prev, data.message]
        })
        // Auto-mark as read
        api.patch(`/chat/conversations/${selectedConversation._id}/read`).catch(() => {})
      }
    }

    const handleMessagesRead = (data: { conversationId: string }) => {
      setMessages(prev =>
        prev.map(m =>
          m.conversationId === data.conversationId ? { ...m, isRead: true } : m
        )
      )
    }

    socket.on('chat:new_message', handleNewMessage)
    socket.on('chat:messages_read', handleMessagesRead)

    return () => {
      socket.off('chat:new_message', handleNewMessage)
      socket.off('chat:messages_read', handleMessagesRead)
    }
  }, [socket, selectedConversation, fetchConversations])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load messages for selected conversation
  const selectConversation = async (conv: Conversation) => {
    setSelectedConversation(conv)
    setMessagesLoading(true)
    setMessages([])

    try {
      const res = await api.get(`/chat/conversations/${conv._id}/messages?limit=100`)
      if (res.data.success) {
        setMessages(res.data.data)
      }
      // Mark as read
      await api.patch(`/chat/conversations/${conv._id}/read`)
      setConversations(prev =>
        prev.map(c => c._id === conv._id ? { ...c, unreadByAdmin: 0 } : c)
      )
    } catch (err) {
      console.error('Failed to load messages:', err)
    } finally {
      setMessagesLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return

    const text = newMessage.trim()
    setNewMessage('')
    setSending(true)

    try {
      const res = await api.post(`/chat/conversations/${selectedConversation._id}/messages`, {
        message: text,
      })
      if (res.data.success) {
        setMessages(prev => {
          if (prev.find(m => m._id === res.data.data._id)) return prev
          return [...prev, res.data.data]
        })
        // Update conversation preview
        setConversations(prev =>
          prev.map(c =>
            c._id === selectedConversation._id
              ? { ...c, lastMessage: text, lastMessageAt: new Date().toISOString() }
              : c
          )
        )
      }
    } catch (err) {
      console.error('Failed to send message:', err)
      setNewMessage(text) // Restore on failure
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const closeConversation = async (convId: string) => {
    try {
      await api.patch(`/chat/conversations/${convId}/close`)
      setConversations(prev => prev.map(c => c._id === convId ? { ...c, status: 'closed' } : c))
      if (selectedConversation?._id === convId) {
        setSelectedConversation(prev => prev ? { ...prev, status: 'closed' } : null)
      }
    } catch (err) {
      console.error('Failed to close conversation:', err)
    }
  }

  const filteredConversations = conversations.filter(c => {
    if (!searchTerm.trim()) return true
    const q = searchTerm.toLowerCase()
    return (
      c.userId.name.toLowerCase().includes(q) ||
      c.userId.email.toLowerCase().includes(q) ||
      c.lastMessage.toLowerCase().includes(q)
    )
  })

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadByAdmin, 0)

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString()
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Top Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Chat Support</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {totalUnread > 0 ? `${totalUnread} unread message${totalUnread > 1 ? 's' : ''}` : 'All caught up'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Circle
              size={8}
              className={isConnected ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'}
            />
            <span className="text-xs text-gray-500">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          <a
            href="/admin/bookings"
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Back to Dashboard
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Conversation List */}
        <div className={`w-80 lg:w-96 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col flex-shrink-0 ${
          selectedConversation ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Search */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="animate-spin text-blue-500" size={24} />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Inbox className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'No conversations match your search' : 'No conversations yet'}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv._id}
                  onClick={() => selectConversation(conv)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-gray-100 dark:border-gray-700 transition hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                    selectedConversation?._id === conv._id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-500'
                      : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                      {conv.userId.name.charAt(0).toUpperCase()}
                    </div>
                    {conv.status === 'closed' && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center">
                        <XCircle size={10} className="text-white" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium truncate ${
                        conv.unreadByAdmin > 0
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {conv.userId.name}
                      </p>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {formatTime(conv.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{conv.userId.email}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className={`text-xs truncate ${
                        conv.unreadByAdmin > 0
                          ? 'text-gray-900 dark:text-gray-200 font-medium'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {conv.lastMessage || 'No messages yet'}
                      </p>
                      {conv.unreadByAdmin > 0 && (
                        <span className="ml-2 flex-shrink-0 w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                          {conv.unreadByAdmin > 9 ? '9+' : conv.unreadByAdmin}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 ${
          !selectedConversation ? 'hidden md:flex' : 'flex'
        }`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
                  </button>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                    {selectedConversation.userId.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {selectedConversation.userId.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedConversation.userId.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedConversation.status === 'active' ? (
                    <button
                      onClick={() => closeConversation(selectedConversation._id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                    >
                      Close Chat
                    </button>
                  ) : (
                    <span className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500">
                      Closed
                    </span>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader className="animate-spin text-blue-500" size={24} />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <MessageCircle className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-sm text-gray-500">No messages yet</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isAdmin = msg.senderRole === 'admin' || msg.senderRole === 'superadmin'
                    return (
                      <div
                        key={msg._id}
                        className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[75%] ${isAdmin ? 'order-2' : ''}`}>
                          <div
                            className={`px-3.5 py-2.5 rounded-2xl ${
                              isAdmin
                                ? 'bg-blue-600 text-white rounded-br-md'
                                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md shadow-sm border border-gray-200 dark:border-gray-600'
                            }`}
                          >
                            {!isAdmin && (
                              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                                {msg.senderName}
                              </p>
                            )}
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                          </div>
                          <p className={`text-[10px] mt-1 ${
                            isAdmin ? 'text-right' : 'text-left'
                          } text-gray-400`}>
                            {isAdmin && msg.senderName && (
                              <span className="mr-1">{msg.senderName}</span>
                            )}
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {isAdmin && msg.isRead && <span className="ml-1 text-blue-400">read</span>}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {selectedConversation.status === 'active' ? (
                <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder="Type a reply..."
                      className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!newMessage.trim() || sending}
                      className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3 text-center">
                  <p className="text-sm text-gray-500">This conversation has been closed.</p>
                </div>
              )}
            </>
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                <MessageCircle className="h-8 w-8 text-blue-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Chat Support</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                Select a conversation from the left to start replying. Messages are delivered in real-time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminChatDashboard
