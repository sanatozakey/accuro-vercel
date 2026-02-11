import React, { useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  type: ToastType
  message: string
  onClose: () => void
  duration?: number
  darkMode?: boolean
}

export function Toast({ type, message, onClose, duration = 5000, darkMode = false }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
  }

  const lightColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
  }

  const darkColors = {
    success: 'bg-green-900/30 border-green-700',
    error: 'bg-red-900/30 border-red-700',
    warning: 'bg-yellow-900/30 border-yellow-700',
    info: 'bg-blue-900/30 border-blue-700',
  }

  const lightTextColors = {
    success: 'text-green-800',
    error: 'text-red-800',
    warning: 'text-yellow-800',
    info: 'text-blue-800',
  }

  const darkTextColors = {
    success: 'text-green-200',
    error: 'text-red-200',
    warning: 'text-yellow-200',
    info: 'text-blue-200',
  }

  const colors = darkMode ? darkColors : lightColors
  const textColors = darkMode ? darkTextColors : lightTextColors

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-md w-full ${colors[type]} border rounded-lg shadow-lg p-4 flex items-start animate-slide-in`}
    >
      <div className="flex-shrink-0">{icons[type]}</div>
      <div className={`ml-3 flex-1 ${textColors[type]}`}>
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button
        onClick={onClose}
        className={`ml-4 flex-shrink-0 ${textColors[type]} hover:opacity-70`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// Toast Container for managing multiple toasts
interface ToastData {
  id: string
  type: ToastType
  message: string
}

interface ToastContainerProps {
  toasts: ToastData[]
  removeToast: (id: string) => void
  darkMode?: boolean
}

export function ToastContainer({ toasts, removeToast, darkMode = false }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          message={toast.message}
          onClose={() => removeToast(toast.id)}
          darkMode={darkMode}
        />
      ))}
    </div>
  )
}
