"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

interface UserProfile {
  firstName: string
  lastName: string
  username: string
  email: string
  phoneNumber: string
  joinedOn: string
  subscriptionPlan: string
  subscriptionExpiry: string
  status: string
  role: string
  avatar: string
}

interface UserProfileProps {
  user: UserProfile
  onSave: (updatedUser: Partial<UserProfile>) => void
  className?: string
}

const statusOptions = ["Active", "Inactive", "Suspended"]
const roleOptions = ["User", "Admin", "Manager", "Agent"]

export function UserProfile({ user, onSave, className = "" }: UserProfileProps) {
  const [status, setStatus] = useState(user.status)
  const [role, setRole] = useState(user.role)
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const [isRoleOpen, setIsRoleOpen] = useState(false)

  const handleSave = () => {
    onSave({ status, role })
  }

  const hasChanges = status !== user.status || role !== user.role

  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      {/* Profile Information Section */}
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>

        {/* Avatar */}
        <div className="flex justify-center mb-8">
          <div className="w-32 h-32 rounded-full overflow-hidden">
            <img
              src={user.avatar || "/placeholder.svg?height=128&width=128"}
              alt={`${user.firstName} ${user.lastName}`}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* User Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">First Name</label>
            <p className="text-gray-900 font-medium">{user.firstName}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Last Name</label>
            <p className="text-gray-900 font-medium">{user.lastName}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Username</label>
            <p className="text-gray-900 font-medium">{user.username}</p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
            <p className="text-gray-900 font-medium">{user.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
            <p className="text-gray-900 font-medium">{user.phoneNumber}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Joined on</label>
            <p className="text-gray-900 font-medium">{user.joinedOn}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Subscription Plan</label>
            <p className="text-gray-900 font-medium">{user.subscriptionPlan}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Subscription Expiry</label>
            <p className="text-gray-900 font-medium">{user.subscriptionExpiry}</p>
          </div>
        </div>
      </div>

      {/* Editable Fields Section */}
      <div className="p-6 space-y-6">
        {/* Status Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <div className="relative">
            <button
              onClick={() => setIsStatusOpen(!isStatusOpen)}
              className="w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none flex items-center justify-between"
            >
              <span className="text-gray-900">{status}</span>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </button>

            {isStatusOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                {statusOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setStatus(option)
                      setIsStatusOpen(false)
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none first:rounded-t-lg last:rounded-b-lg"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Role Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
          <div className="relative">
            <button
              onClick={() => setIsRoleOpen(!isRoleOpen)}
              className="w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none flex items-center justify-between"
            >
              <span className="text-gray-900">{role}</span>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </button>

            {isRoleOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                {roleOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setRole(option)
                      setIsRoleOpen(false)
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none first:rounded-t-lg last:rounded-b-lg"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  )
}
