"use client"

import { useState } from "react"
import { ArrowLeft, ChevronDown } from "lucide-react"

interface UserProfileData {
  firstName: string
  lastName: string
  username: string
  email: string
  phoneNumber: string
  role: string
  bankName: string
  accountNumber: string
  accountName: string
  address: string
  educationQualification: string
  verificationMethod: string
  kycAccountName: string
  status: string
  kycStatus: "Pending" | "Approved" | "Rejected"
  avatar: string
}

// Mock data example
export const mockUserProfile: UserProfileData = {
  firstName: "Jane",
  lastName: "Doe",
  username: "janedoe",
  email: "jane.doe@example.com",
  phoneNumber: "+1234567890",
  role: "Manager",
  bankName: "First National Bank",
  accountNumber: "123456789",
  accountName: "Jane Doe",
  address: "123 Main St, Springfield",
  educationQualification: "B.Sc. Computer Science",
  verificationMethod: "BVN",
  kycAccountName: "Jane Doe",
  status: "Active",
  kycStatus: "Pending",
  avatar: "/avatar-jane.png",
}

interface UserProfileKYCProps {
  user: UserProfileData
  onSave: (data: any) => void
  onBack?: () => void
}

const statusOptions = ["Active", "Inactive", "Suspended", "Pending"]
const roleOptions = ["User", "Admin", "Manager", "Agent", "Property Manager"]

export function UserProfileKYC({ user, onSave, onBack }: UserProfileKYCProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "permissions">("profile")
  const [formData, setFormData] = useState({
    status: user.status,
    role: user.role,
    notes: "",
    additionalInfo: "",
  })
  const [dropdowns, setDropdowns] = useState({
    status: false,
    role: false,
  })

  const handleSubmit = () => {
    onSave({
      ...formData,
      tab: activeTab,
    })
  }

  const handleSaveChanges = () => {
    onSave({
      status: formData.status,
      role: formData.role,
    })
  }

  const hasChanges = formData.status !== user.status || formData.role !== user.role

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-600">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">5</span>
              </div>
            </div>
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium">T</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 lg:p-6">
        {/* Desktop Back Button */}
        <button onClick={onBack} className="hidden lg:flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Tab Navigation */}
        <div className="flex items-center gap-8 mb-8 border-b">
          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
              activeTab === "profile"
                ? "border-green-600 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Profile & KYC
          </button>
          <button
            onClick={() => setActiveTab("permissions")}
            className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
              activeTab === "permissions"
                ? "border-green-600 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Permissions
          </button>
        </div>

        {/* Profile & KYC Tab */}
        {activeTab === "profile" && (
          <div className="space-y-8">
            {/* Personal Information */}
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  KYC Pending
                </span>
              </div>

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

              {/* Personal Details Grid */}
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
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                  <p className="text-gray-900 font-medium">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                  <p className="text-gray-900 font-medium">{user.phoneNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Role</label>
                  <p className="text-gray-900 font-medium">{user.role}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Bank Name</label>
                  <p className="text-gray-900 font-medium">{user.bankName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Account Number</label>
                  <p className="text-gray-900 font-medium">{user.accountNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Account Name</label>
                  <p className="text-gray-900 font-medium">{user.accountName}</p>
                </div>
              </div>
            </div>

            {/* KYC Information */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">KYC Information</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
                  <p className="text-gray-900 font-medium">{user.address}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Education qualification</label>
                    <p className="text-gray-900 font-medium">{user.educationQualification}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Verification Method</label>
                    <p className="text-gray-900 font-medium">{user.verificationMethod}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Account Name</label>
                    <p className="text-gray-900 font-medium">{user.kycAccountName}</p>
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Additional Information</label>
                  <textarea
                    value={formData.additionalInfo}
                    onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
                    placeholder="Enter additional information..."
                  />
                </div>

                {/* Status Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <div className="relative">
                    <button
                      onClick={() => setDropdowns({ ...dropdowns, status: !dropdowns.status })}
                      className="w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none flex items-center justify-between"
                    >
                      <span className="text-gray-500">Select Status</span>
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    </button>

                    {dropdowns.status && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                        {statusOptions.map((option) => (
                          <button
                            key={option}
                            onClick={() => {
                              setFormData({ ...formData, status: option })
                              setDropdowns({ ...dropdowns, status: false })
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

                {/* Leave a note */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Leave a note</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
                    placeholder="Enter your notes..."
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleSubmit}
                    className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Permissions Tab */}
        {activeTab === "permissions" && (
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                KYC Pending
              </span>
            </div>

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

            {/* Status and Role Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Status Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="relative">
                  <button
                    onClick={() => setDropdowns({ ...dropdowns, status: !dropdowns.status })}
                    className="w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none flex items-center justify-between"
                  >
                    <span className="text-gray-500">Select Status</span>
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </button>

                  {dropdowns.status && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                      {statusOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setFormData({ ...formData, status: option })
                            setDropdowns({ ...dropdowns, status: false })
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
                    onClick={() => setDropdowns({ ...dropdowns, role: !dropdowns.role })}
                    className="w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none flex items-center justify-between"
                  >
                    <span className="text-gray-500">Select Role</span>
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </button>

                  {dropdowns.role && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                      {roleOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setFormData({ ...formData, role: option })
                            setDropdowns({ ...dropdowns, role: false })
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
            </div>

            {/* Save Changes Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSaveChanges}
                disabled={!hasChanges}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                Save changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
