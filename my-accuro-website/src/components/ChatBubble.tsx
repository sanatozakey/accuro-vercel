import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { ChatWindow } from './ChatWindow';
import api from '../services/api';

export function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, isAuthenticated } = useAuth();
  const { socket, isConnected } = useSocket();

  // Don't render on admin pages or if not logged in
  const isAdminPage = window.location.pathname.startsWith('/admin');
  const shouldShow = isAuthenticated && user && !isAdminPage;

  // Fetch unread count on mount
  useEffect(() => {
    if (!user) return;

    const fetchUnread = async () => {
      try {
        const res = await api.get('/chat/unread-count');
        if (res.data.success) {
          setUnreadCount(res.data.data?.unreadCount ?? 0);
        }
      } catch (error) {
        // Silently fail - chat is optional
        console.error('Failed to fetch chat unread count:', error);
      }
    };

    fetchUnread();
  }, [user]);

  // Listen for socket events
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewMessage = (data: any) => {
      // Only increment for messages from others (not our own)
      const msg = data?.message || data;
      if (msg?.senderId === user?._id) return;
      // Only increment if chat window is closed
      if (!isOpen) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    const handleMessagesRead = () => {
      setUnreadCount(0);
    };

    socket.on('chat:new_message', handleNewMessage);
    socket.on('chat:messages_read', handleMessagesRead);

    return () => {
      socket.off('chat:new_message', handleNewMessage);
      socket.off('chat:messages_read', handleMessagesRead);
    };
  }, [socket, isConnected, isOpen]);

  const handleUnreadChange = useCallback((count: number) => {
    setUnreadCount(count);
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    // Unread count will be reset by ChatWindow once it marks messages as read
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!shouldShow) return null;

  return (
    <>
      {/* Chat Window */}
      <ChatWindow
        isOpen={isOpen}
        onClose={handleClose}
        onUnreadChange={handleUnreadChange}
      />

      {/* Floating Chat Button */}
      <button
        onClick={isOpen ? handleClose : handleOpen}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg
          bg-gradient-to-r from-blue-600 to-blue-700
          hover:from-blue-700 hover:to-blue-800
          text-white transition-all duration-300 ease-in-out
          hover:scale-105 active:scale-95
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          dark:focus:ring-offset-gray-900
          ${unreadCount > 0 && !isOpen ? 'animate-pulse' : ''}`}
        aria-label={isOpen ? 'Close chat' : 'Open chat support'}
      >
        {isOpen ? (
          <MessageCircle size={24} className="rotate-0" />
        ) : (
          <MessageCircle size={24} />
        )}

        {/* Unread Badge */}
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </>
  );
}
