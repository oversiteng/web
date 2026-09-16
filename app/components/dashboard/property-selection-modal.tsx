"use client"

import type React from "react"

import { X } from "lucide-react"

interface Property {
  id: string
  name: string
  image: string
}

interface PropertySelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onPropertySelect: (propertyId: string) => void
}

export function PropertySelectionModal({ isOpen, onClose, onPropertySelect }: PropertySelectionModalProps) {
  const properties: Property[] = [
    {
      id: "1",
      name: "Green Land Estate",
      image: "/property.png",
    },
    {
      id: "2",
      name: "Green Land Estate",
      image: "/property.png",
    },
    {
      id: "3",
      name: "Green Land Estate",
      image: "/property.png",
    },
    {
      id: "4",
      name: "Green Land Estate",
      image: "/property.png",
    },
    {
      id: "5",
      name: "Green Land Estate",
      image: "/property.png",
    },
    {
      id: "6",
      name: "Green Land Estate",
      image: "/property.png",
    },
  ]

  if (!isOpen) return null

  const handlePropertyClick = (propertyId: string) => {
    onPropertySelect(propertyId)
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleBackdropClick}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex-1 pr-4">
            <h2 className="text-lg font-medium text-[#212A3B] mb-2">
              Select a Property to view State policy updates
            </h2>
            <p className="text-[#474E5C] text-sm">Discover the latest updates about your property and stay in the loop!</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg transition-colors flex-shrink-0">
            <X className="w-6 h-6 text-[#000000]" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Mobile: Single column, Desktop: 3 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <div key={property.id} onClick={() => handlePropertyClick(property.id)} className="cursor-pointer group">
                <div className="bg-white rounded-lg overflow-hidden transition-transform group-hover:scale-105">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={property.image || "/placeholder.svg"}
                      alt={property.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    />
                  </div>
                  <div className="py-4">
                    <h3 className="text-base font-medium text-[#212A3B]">{property.name}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
