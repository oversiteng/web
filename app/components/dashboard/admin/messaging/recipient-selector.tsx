"use client"

import { useState, useRef, useEffect } from "react"
import { Search, X } from "lucide-react"
import type { Recipient } from  "@/libs/interface"

interface RecipientSelectorProps {
  selectedRecipients: Recipient[]
  onRecipientsChange: (recipients: Recipient[]) => void
}

const availableRecipients: Recipient[] = [
  { id: "broadcast-all", type: "broadcast", label: "Broadcast to everyone", value: "everyone" },
  { id: "broadcast-users", type: "broadcast", label: "Broadcast to user", value: "users" },
  { id: "broadcast-managers", type: "broadcast", label: "Broadcast to property manager", value: "managers" },
  { id: "user-1", type: "user", label: "Timothy Thomson", value: "timothy.thomson@example.com" },
  { id: "user-2", type: "user", label: "Timothy Thomson", value: "timothy.thomson2@example.com" },
  { id: "user-3", type: "user", label: "Timothy Thomson", value: "timothy.thomson3@example.com" },
  { id: "user-4", type: "user", label: "Timothy Thomson", value: "timothy.thomson4@example.com" },
  { id: "user-5", type: "user", label: "Timothy Thomson", value: "timothy.thomson5@example.com" },
  { id: "user-6", type: "user", label: "Timothy Thomson", value: "timothy.thomson6@example.com" },
]

export function RecipientSelector({ selectedRecipients, onRecipientsChange }: RecipientSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredRecipients = availableRecipients.filter(
    (recipient) =>
      recipient.label.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedRecipients.find((selected) => selected.id === recipient.id),
  )

  const handleSelectRecipient = (recipient: Recipient) => {
    onRecipientsChange([...selectedRecipients, recipient])
    setSearchTerm("")
    setIsOpen(false)
  }

  const handleRemoveRecipient = (recipientId: string) => {
    onRecipientsChange(selectedRecipients.filter((r) => r.id !== recipientId))
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Recipient</label>

      {/* Selected Recipients Tags */}
      {selectedRecipients.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedRecipients.map((recipient) => (
            <div
              key={recipient.id}
              className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
            >
              <span>{recipient.label}</span>
              <button
                type="button"
                onClick={() => handleRemoveRecipient(recipient.id)}
                className="hover:bg-gray-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Field */}
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search recipients..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          />
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredRecipients.length > 0 ? (
              filteredRecipients.map((recipient) => (
                <button
                  key={recipient.id}
                  type="button"
                  onClick={() => handleSelectRecipient(recipient)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                >
                  <div className="font-medium text-gray-900">{recipient.label}</div>
                  {recipient.type === "user" && <div className="text-sm text-gray-500">{recipient.value}</div>}
                </button>
              ))
            ) : (
              <div className="px-4 py-2 text-gray-500 text-sm">No recipients found</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
