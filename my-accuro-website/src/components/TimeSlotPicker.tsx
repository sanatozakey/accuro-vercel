import React, { useState, useEffect } from 'react'
import { Clock, CheckCircle, XCircle } from 'lucide-react'
import bookingService from '../services/bookingService'

interface TimeSlotPickerProps {
  selectedDate: string
  selectedTime: string
  onTimeSelect: (time: string) => void
}

interface TimeSlot {
  time: string
  available: boolean
  booking?: {
    company: string
    purpose: string
  }
}

export function TimeSlotPicker({ selectedDate, selectedTime, onTimeSelect }: TimeSlotPickerProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)

  // Generate time slots from 8:00 AM to 5:00 PM
  const generateTimeSlots = (): string[] => {
    const slots: string[] = []
    for (let hour = 8; hour <= 17; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`)
      if (hour < 17) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`)
      }
    }
    return slots
  }

  useEffect(() => {
    if (!selectedDate) return

    const checkAvailability = async () => {
      setLoading(true)
      try {
        const response = await bookingService.getAll({
          startDate: selectedDate,
          endDate: selectedDate,
        })

        const bookedSlots = response.data
          .filter((booking) => booking.status === 'confirmed' || booking.status === 'pending')
          .map((booking) => ({
            time: booking.time,
            company: booking.company,
            purpose: booking.purpose,
          }))

        const slots = generateTimeSlots().map((time) => {
          const booking = bookedSlots.find((b) => b.time === time)
          return {
            time,
            available: !booking,
            booking: booking ? { company: booking.company, purpose: booking.purpose } : undefined,
          }
        })

        setTimeSlots(slots)
      } catch (err) {
        console.error('Error checking availability:', err)
        // If error, show all slots as available
        const slots = generateTimeSlots().map((time) => ({
          time,
          available: true,
        }))
        setTimeSlots(slots)
      } finally {
        setLoading(false)
      }
    }

    checkAvailability()
  }, [selectedDate])

  if (!selectedDate) {
    return (
      <div className="text-center py-8">
        <Clock className="h-12 w-12 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500">Please select a date first to see available time slots</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 rounded-md animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Available Time Slots for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </h3>
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-gray-600">Available</span>
          </div>
          <div className="flex items-center">
            <XCircle className="h-4 w-4 text-red-500 mr-1" />
            <span className="text-gray-600">Booked</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-96 overflow-y-auto">
        {timeSlots.map((slot) => (
          <button
            key={slot.time}
            type="button"
            onClick={() => slot.available && onTimeSelect(slot.time)}
            disabled={!slot.available}
            className={`
              px-3 py-2 rounded-md text-sm font-medium transition relative
              ${
                selectedTime === slot.time
                  ? 'bg-blue-600 text-white ring-2 ring-blue-600'
                  : slot.available
                  ? 'bg-white border-2 border-green-300 text-gray-700 hover:bg-green-50 hover:border-green-400'
                  : 'bg-gray-100 border-2 border-red-200 text-gray-400 cursor-not-allowed'
              }
            `}
            title={
              slot.booking
                ? `Booked by ${slot.booking.company} for ${slot.booking.purpose}`
                : 'Available'
            }
          >
            <div className="flex items-center justify-center">
              {slot.available ? (
                <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <XCircle className="h-3 w-3 mr-1 text-red-500" />
              )}
              {slot.time}
            </div>
          </button>
        ))}
      </div>

      {timeSlots.filter((s) => s.available).length === 0 && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800 text-sm">
            No available time slots for this date. Please select a different date.
          </p>
        </div>
      )}
    </div>
  )
}
