"use client"

import { useState } from "react"
import { X, Check, Calendar, Clock } from "lucide-react"
import type { ScheduleOption } from "@/libs/interface"

interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  onSchedule: (date: Date) => void
}

const presetOptions: ScheduleOption[] = [
  { id: "tomorrow", label: "Tomorrow morning", date: "Feb 21", time: "8:00 AM" },
  { id: "monday", label: "Monday morning", date: "Feb 24", time: "8:00 AM" },
]

export function ScheduleModal({ isOpen, onClose, onSchedule }: ScheduleModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>("tomorrow")
  const [customDate, setCustomDate] = useState("January 01")
  const [customTime, setCustomTime] = useState("12:00 AM")

  const handleSchedule = () => {
    if (selectedPreset) {
      const preset = presetOptions.find((p) => p.id === selectedPreset)
      if (preset) {
        // Create a date from the preset (simplified for demo)
        const date = new Date()
        date.setDate(date.getDate() + (selectedPreset === "tomorrow" ? 1 : 3))
        date.setHours(8, 0, 0, 0)
        onSchedule(date)
      }
    } else {
      // Handle custom date/time
      const date = new Date()
      onSchedule(date)
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
        <div className="absolute inset-0 bg-[#171D2933] bg-opacity-50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-[#212A3B]">Schedule Notice</h2>
            <button onClick={onClose} className="text-#212A3B cursor-pointer hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col">
            {/* Preset Options */}
            {presetOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedPreset(option.id)}
                className={`w-full text-left p-3 transition-colors cursor-pointer`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-full">
                    <div className="font-medium text-[#474E5C] px-4 py-2">{option.label}</div>
                    <div className={`w-full p-3 rounded-lg flex font-normal text-sm  ${selectedPreset === option.id ? "text-[#000000] bg-[#E6F3EE]" : "text-[#474E5C]"
                      }`}>
                      {option.date}, {option.time}
                      {selectedPreset === option.id && <Check className="w-5 h-5 text-[#448C74]" />}
                    </div>
                  </div>
                </div>
              </button>
            ))}

            {/* Custom Date/Time */}
            <div className="border-t pt-4">
              <h3 className="font-medium text-[#474E5C] mb-3">Pick a Date</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring focus:border-[#448C74] outline-none pr-8"
                    />
                    <Calendar className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring focus:border-[#448C74] outline-none pr-8"
                    />
                    <Clock className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={handleSchedule}
              className="bg-[#448C74] cursor-pointer text-white px-6 py-2 rounded-lg font-medium"
            >
              Send Message
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
