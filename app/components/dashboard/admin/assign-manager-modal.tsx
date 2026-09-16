"use client"

import { useState } from "react"
import { X } from "lucide-react"

interface Manager {
  id: string
  name: string
  email: string
  username: string
}

interface AssignManagerModalProps {
  isOpen: boolean
  onClose: () => void
  onAssign: (manager: Manager) => void
  managers?: Manager[]
}

const defaultManagers: Manager[] = [
  {
    id: "1",
    name: "Bola Ahmed",
    email: "Bolaahmed@gmail.com",
    username: "username",
  },
  {
    id: "2",
    name: "Jane Doe",
    email: "janedoe@example.com",
    username: "janedoe123",
  },
  {
    id: "3",
    name: "John Smith",
    email: "johnsmith@example.com",
    username: "johnnyS",
  },
  {
    id: "4",
    name: "Emily Chen",
    email: "emilychen@example.com",
    username: "emilyC",
  },
]

export function AssignManagerModal({ isOpen, onClose, onAssign, managers = defaultManagers }: AssignManagerModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null)

  const filteredManagers = managers.filter(
    (manager) =>
      manager.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manager.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manager.username.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAssign = () => {
    if (selectedManager) {
      onAssign(selectedManager)
      setSelectedManager(null)
      setSearchTerm("")
      onClose()
    }
  }

  const handleCancel = () => {
    setSelectedManager(null)
    setSearchTerm("")
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-75 backdrop-blur-sm" onClick={handleCancel} />
      <div className="relative bg-white flex flex-col align-center justify-center gap-6 rounded-lg min-h-[16.375rem] p-8 w-full md:max-w-[35.75rem] max-w-[29.75rem] mx-4 overflow-y-aut">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Assign Listing to a Manager</h2>
            <p className="text-gray-600 mt-1">Assign a manager to this property.</p>
          </div>
          <button onClick={handleCancel} className="cursor-pointer text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative ">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter name, username or email address"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg  outline-none"
          />
        </div>

        {/* Selected Manager */}
        {selectedManager && (
          <div className="">
            <div className="bg-[#ECF4F1] rounded-lg p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-[#474E5C] text-sm ">{selectedManager.name}</h3>
                <button
                  onClick={() => setSelectedManager(null)}
                  className="text-[#000000] cursor-pointer text-sm font-medium"
                >
                  Remove
                </button>
              </div>
              <div className="flex items-center gap-4 text-xs text-[#474E5C] mt-1">
                <span>{selectedManager.email}</span>
                <span>{selectedManager.username}</span>
              </div>

            </div>
          </div>
        )}

        {/* Manager List */}
        {!selectedManager && (
          <div className="space-y-2 mb-6 top-43 md:left-[calc(50%-(31.75rem/2))] left-[calc(50%-(26.75rem/2))] max-h-60 absolute overflow-y-auto shadow-xl shadow-[#1E1E1E1A] border border-[#E9EAEB] rounded-lg z-50 bg-white no-scrollbar md:max-w-[31.75rem] max-w-[26.75rem]">
            {filteredManagers.map((manager) => (
              <button
                key={manager.id}
                onClick={() => setSelectedManager(manager)}
                className="w-full cursor-pointer text-left p-4 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-colors"
              >
                <h3 className="font-medium text-gray-900">{manager.name}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                  <span>{manager.email}</span>
                  <span>{manager.username}</span>
                </div>
              </button>
            ))}

            {filteredManagers.length === 0 && (
              <div className="text-center py-8 text-gray-500">No managers found matching your search.</div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="cursor-pointer px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedManager}
            className="cursor-pointer px-6 py-2 bg-[#448C74] text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Assign Role
          </button>
        </div>
      </div>
    </div>
  )
}
