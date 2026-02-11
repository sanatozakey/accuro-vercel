import React from 'react'
import { AlertCircle, X } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmStyle?: 'danger' | 'primary'
  darkMode?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmStyle = 'danger',
  darkMode = false,
}: ConfirmModalProps) {
  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-[60] animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className={`rounded-lg shadow-2xl max-w-md w-full animate-slide-in ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          {/* Header */}
          <div className={`flex items-start justify-between p-5 border-b ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  confirmStyle === 'danger'
                    ? darkMode ? 'bg-red-900/50' : 'bg-red-100'
                    : darkMode ? 'bg-blue-900/50' : 'bg-blue-100'
                }`}
              >
                <AlertCircle
                  className={
                    confirmStyle === 'danger' ? 'text-red-500' : 'text-blue-500'
                  }
                  size={20}
                />
              </div>
              <h3 className={`text-lg font-semibold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>{title}</h3>
            </div>
            <button
              onClick={onClose}
              className={`transition ${
                darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-5">
            <p className={`text-sm leading-relaxed ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>{message}</p>
          </div>

          {/* Footer */}
          <div className={`flex gap-3 p-5 rounded-b-lg ${
            darkMode ? 'bg-gray-900/50' : 'bg-gray-50'
          }`}>
            <button
              onClick={onClose}
              className={`flex-1 px-4 py-2.5 border rounded-md transition font-medium text-sm ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 px-4 py-2.5 rounded-md transition font-medium text-sm text-white ${
                confirmStyle === 'danger'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
