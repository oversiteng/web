"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { X, ChevronDown } from "lucide-react"

export type ReviewType = "landmarks" | "building-material-cost"

interface ReviewFormData {
  reviewType: ReviewType
  distanceAndTime?: string
  buildingMaterialName?: string
  unit: string
  previousPrice: string
  currentPrice: string
}

interface AddReviewModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ReviewFormData) => void
  initialReviewType?: ReviewType
}

const reviewTypeOptions = [
  { value: "landmarks" as ReviewType, label: "Landmarks" },
  { value: "building-material-cost" as ReviewType, label: "Building Material Cost" },
]

export function AddReviewModal({ isOpen, onClose, onSubmit, initialReviewType ="landmarks" }: AddReviewModalProps) {
  const [formData, setFormData] = useState<ReviewFormData>({
    reviewType: initialReviewType,
    distanceAndTime: "",
    buildingMaterialName: "",
    unit: "",
    previousPrice: "",
    currentPrice: "",
  })
  const [reviewContent, setReviewContent] = useState("")
  const [showMobileEditor, setShowMobileEditor] = useState(false)
  const [reviewType, setReviewType] = useState("Expert Review")

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    onClose()
  }

  const handleReviewTypeChange = (newType: ReviewType) => {
    setFormData({
      ...formData,
      reviewType: newType,
      // Clear type-specific fields when switching
      distanceAndTime: "",
      buildingMaterialName: "",
    })
    setIsDropdownOpen(false)
  }
  const handleUploadReview = () => {
    console.log("Uploading review:", { reviewType, reviewContent })
    onClose()
    setShowMobileEditor(false)
    setReviewContent("")
  }
  const handleCancel = () => {
    onClose()
    setShowMobileEditor(false)
    setReviewContent("")
  }

  const selectedReviewType = reviewTypeOptions.find((option) => option.value === formData.reviewType)
  useEffect(() => {
    setFormData((prevData) => ({
      ...prevData,
      reviewType: initialReviewType || "landmarks", // Default to "landmarks" if no initial type is provided
    }))
  }, [])
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Add a review</h2>
            <p className="text-gray-600 mt-1">Update the landowner about recent developments in this property.</p>
          </div>
          <button onClick={onClose} className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Review Type Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Review Type</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full px-4 py-3 text-left bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none flex items-center justify-between"
              >
                <span className="text-gray-700">{selectedReviewType?.label || "Select review type"}</span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </button>

              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                  {reviewTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleReviewTypeChange(option.value)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none first:rounded-t-lg last:rounded-b-lg"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Field Based on Review Type */}
          {formData.reviewType === "landmarks" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Distance & Est. Time</label>
              <input
                type="text"
                value={formData.distanceAndTime}
                onChange={(e) => setFormData({ ...formData, distanceAndTime: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="Enter distance and estimated time"
              />
            </div>
          )}

          {formData.reviewType === "building-material-cost" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Building Material Name</label>
              <input
                type="text"
                value={formData.buildingMaterialName}
                onChange={(e) => setFormData({ ...formData, buildingMaterialName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="Enter building material name"
              />
            </div>
          )}

          {/* Unit Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
            <input
              type="text"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              placeholder="Enter unit"
            />
          </div>

          {/* Previous Price Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Previous Price</label>
            <input
              type="text"
              value={formData.previousPrice}
              onChange={(e) => setFormData({ ...formData, previousPrice: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              placeholder="Enter previous price"
            />
          </div>

          {/* Current Price Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Price</label>
            <input
              type="text"
              value={formData.currentPrice}
              onChange={(e) => setFormData({ ...formData, currentPrice: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              placeholder="Enter current price"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUploadReview}
              className="cursor-pointer px-6 py-3 h-[2.75rem] bg-[#448C74] text-white rounded-lg hover:bg-[#357a63] transition-colors"
            >
              Upload Review
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
