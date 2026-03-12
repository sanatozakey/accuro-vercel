import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageCircle,
  Send,
  X,
  User,
  Calendar,
  FileText,
  RefreshCw,
  ShoppingCart,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import api from '../services/api';

interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  senderRole: string;
  senderName: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadChange: (count: number) => void;
}

const QUICK_ACTIONS = [
  { action: 'check_booking', label: 'Check Booking Status', icon: Calendar, userMessage: "I'd like to check my booking status" },
  { action: 'check_quotation', label: 'Check Quotation', icon: FileText, userMessage: "I'd like to check my quotation status" },
  { action: 'reschedule', label: 'Reschedule Booking', icon: RefreshCw, userMessage: 'I need to reschedule my booking' },
  { action: 'product_inquiry', label: 'Product Inquiry', icon: ShoppingCart, userMessage: 'I have a question about your products' },
  { action: 'technical_support', label: 'Technical Support', icon: HelpCircle, userMessage: 'I need technical support' },
  { action: 'talk_to_agent', label: 'Talk to Agent', icon: MessageCircle, userMessage: "I'd like to speak with an agent" },
] as const;

type QuickAction = (typeof QUICK_ACTIONS)[number];

export function ChatWindow({ isOpen, onClose, onUnreadChange }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [adminOnline, setAdminOnline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Load conversation and messages when opened
  useEffect(() => {
    if (!isOpen || !user) return;

    const loadConversation = async () => {
      setIsLoading(true);
      try {
        // Get or create conversation
        const convRes = await api.post('/chat/conversation');
        const conv = convRes.data.data;
        setConversationId(conv._id);

        // Load messages
        const msgRes = await api.get(`/chat/conversations/${conv._id}/messages?limit=100`);
        setMessages(msgRes.data.data || []);

        // Mark as read
        await api.patch(`/chat/conversations/${conv._id}/read`);
        onUnreadChange(0);
      } catch (error) {
        console.error('Failed to load chat conversation:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConversation();
  }, [isOpen, user]);

  // Listen for new messages via socket
  useEffect(() => {
    if (!socket || !isConnected || !conversationId) return;

    const handleNewMessage = (data: { message: Message; conversationId: string }) => {
      // Only add if it belongs to our conversation
      if (data.conversationId !== conversationId && data.message?.conversationId !== conversationId) return;

      const msg = data.message || data;
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });

      // If chat is open, mark as read immediately
      if (isOpen) {
        api.patch(`/chat/conversations/${conversationId}/read`).catch(() => {});
        onUnreadChange(0);
      }
    };

    socket.on('chat:new_message', handleNewMessage);

    return () => {
      socket.off('chat:new_message', handleNewMessage);
    };
  }, [socket, isConnected, conversationId, isOpen, onUnreadChange]);

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || !conversationId || isSending) return;

    setIsSending(true);
    setInputValue('');

    try {
      const res = await api.post(`/chat/conversations/${conversationId}/messages`, {
        message: trimmed,
      });

      if (res.data.success) {
        const newMessage: Message = res.data.data;
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMessage._id)) return prev;
          return [...prev, newMessage];
        });
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setInputValue(trimmed);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleQuickAction = async (action: QuickAction) => {
    if (!conversationId || isSending) return;
    setIsSending(true);
    try {
      // Send user message first
      const res = await api.post(`/chat/conversations/${conversationId}/messages`, {
        message: action.userMessage,
      });
      if (res.data.success) {
        const newMessage: Message = res.data.data;
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMessage._id)) return prev;
          return [...prev, newMessage];
        });
      }
      // Trigger auto-reply
      await api.post(`/chat/conversations/${conversationId}/auto-reply`, {
        action: action.action,
      });
      // Bot response will arrive via socket
    } catch (error) {
      console.error('Quick action failed:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOwnMessage = (msg: Message) => msg.senderId === user?._id && msg.senderRole !== 'bot';

  return (
    <div
      className={`fixed bottom-20 right-6 z-50 w-80 sm:w-96 h-[500px] max-h-[70vh] flex flex-col
        bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700
        transition-all duration-300 ease-in-out origin-bottom-right
        ${isOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-95 opacity-0 pointer-events-none'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl flex-shrink-0">
        <div className="flex items-center gap-3">
          <MessageCircle size={20} className="text-white" />
          <div>
            <h3 className="text-sm font-semibold text-white">Chat Support</h3>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${adminOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
              <span className="text-xs text-blue-100">
                {adminOnline ? 'Online' : "We'll reply soon"}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Close chat"
        >
          <X size={18} className="text-white" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Loading messages...</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          /* Empty state with quick action grid */
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center px-2 mb-4">
              <Sparkles size={36} className="mx-auto text-violet-400 dark:text-violet-300 mb-2" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                How can we help you?
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Choose an option or type a message below.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full px-1">
              {QUICK_ACTIONS.map((qa) => {
                const Icon = qa.icon;
                return (
                  <button
                    key={qa.action}
                    onClick={() => handleQuickAction(qa)}
                    disabled={isSending || !conversationId}
                    className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl
                      bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                      hover:bg-violet-50 hover:border-violet-300 dark:hover:bg-violet-900/30 dark:hover:border-violet-600
                      transition-all duration-150 group
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icon
                      size={18}
                      className="text-violet-500 dark:text-violet-400 group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors"
                    />
                    <span className="text-[11px] leading-tight font-medium text-gray-600 dark:text-gray-300 group-hover:text-violet-700 dark:group-hover:text-violet-200 text-center transition-colors">
                      {qa.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const own = isOwnMessage(msg);
            return (
              <div key={msg._id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[75%]">
                  {!own && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <User size={12} className="text-gray-500 dark:text-gray-400" />
                      </div>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {msg.senderName}
                      </span>
                    </div>
                  )}
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                      own
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
                    }`}
                  >
                    {msg.message}
                  </div>
                  <p className={`text-[10px] mt-1 ${own ? 'text-right' : 'text-left'} text-gray-400 dark:text-gray-500`}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions Row (shown when there are messages) */}
      {messages.length > 0 && !isLoading && (
        <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-800 flex-shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap font-medium mr-0.5">
              Quick actions:
            </span>
            {QUICK_ACTIONS.map((qa) => {
              const Icon = qa.icon;
              return (
                <button
                  key={qa.action}
                  onClick={() => handleQuickAction(qa)}
                  disabled={isSending || !conversationId}
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap
                    bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300
                    border border-gray-200 dark:border-gray-700
                    hover:bg-violet-50 hover:text-violet-700 hover:border-violet-300
                    dark:hover:bg-violet-900/30 dark:hover:text-violet-300 dark:hover:border-violet-600
                    transition-all duration-150
                    disabled:opacity-50 disabled:cursor-not-allowed"
                  title={qa.label}
                >
                  <Icon size={10} />
                  <span className="hidden sm:inline">{qa.label}</span>
                  <span className="sm:hidden">{qa.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={isLoading || isSending}
            className="flex-1 px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600
              bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100
              placeholder-gray-400 dark:placeholder-gray-500
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading || isSending}
            className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-200 flex-shrink-0"
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
