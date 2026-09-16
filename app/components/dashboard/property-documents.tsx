"use client"

import type React from "react"

import { useState } from "react"
import { Filter, Eye, Download, FileText, ChevronLeft } from "lucide-react"
import { BackNavButton } from "../backNavButton"

interface Document {
  id: string
  name: string
  size: string
  date: string
  type: "pdf" | "doc" | "image"
}
interface PropertyDocumentsProps {
  propertyName?: string
}
export function PropertyDocuments({ propertyName = "GreenLand Estate" }: PropertyDocumentsProps) {
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null)

  const documents: Document[] = [
    {
      id: "1",
      name: "Name of the document here",
      size: "12.5kb",
      date: "Jan 31,2025",
      type: "pdf",
    },
    {
      id: "2",
      name: "Name of the document here",
      size: "12.5kb",
      date: "Jan 31,2025",
      type: "pdf",
    },
    {
      id: "3",
      name: "Name of the document here",
      size: "12.5kb",
      date: "Jan 31,2025",
      type: "pdf",
    },
    {
      id: "4",
      name: "Name of the document here",
      size: "12.5kb",
      date: "Jan 31,2025",
      type: "pdf",
    },
    {
      id: "5",
      name: "Name of the document here",
      size: "12.5kb",
      date: "Jan 31,2025",
      type: "pdf",
    },
    {
      id: "6",
      name: "Name of the document here",
      size: "12.5kb",
      date: "Jan 31,2025",
      type: "pdf",
    },
    {
      id: "7",
      name: "Name of the document here",
      size: "12.5kb",
      date: "Jan 31,2025",
      type: "pdf",
    },
  ]

  const handleDocumentClick = (documentId: string) => {
    setSelectedDocument(selectedDocument === documentId ? null : documentId)
  }

  const handleView = (documentId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    console.log("View document:", documentId)
    // Add view logic here
  }

  const handleDownload = (documentId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    console.log("Download document:", documentId)
    // Add download logic here
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <BackNavButton />
          <nav className="text-sm text-[#7E838D]">
            <span>My Properties</span>
            <span className="mx-2">/</span>
            <span className="max-w-[140px] truncate inline-block align-bottom" title="Property Report">
              Property Report
            </span>
          </nav>
        </div>

        <button className="flex items-center gap-2 px-3 py-2 text-[#212A3B] font-normal rounded-lg text-sm">
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>


      <div className="flex flex-col justify-between gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[1.125rem] md:text-[1.313rem] font-medium text-[#212A3B]">{propertyName}</h2>
        </div>
        {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"> */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {documents.map((document) => (
            <div
              key={document.id}
              onClick={() => handleDocumentClick(document.id)}
              className={`relative flex items-center h-[6.25rem] min-w-[22.521rem] gap-4 p-4 rounded-lg cursor-pointer transition-all ${selectedDocument === document.id
                ? "bg-[#474E5C66]"
                : "bg-[#FFFFFF]  hover:bg-gray-100"
                }`}
            >
              {/* Document Icon */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-[#ECF4F1] rounded-lg flex items-center justify-center">
                  <FileText className="w-[2.438rem] h-12 text-[#295547]" />
                </div>
              </div>

              {/* Document Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-[#474E5C] truncate mb-[0.875rem]">{document.name}</h3>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-[#7E838D]">{document.size}</span>
                  <span className="text-xs text-[#7E838D]">{document.date}</span>
                </div>
              </div>

              {/* Action Buttons - Show when selected */}
              {selectedDocument === document.id && (
                <div className="absolute inset-0 bg-gray-600/20 rounded-lg flex items-center justify-center gap-4">
                  <button
                    onClick={(e) => handleView(document.id, e)}
                    className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
                  >
                    <Eye className="w-5 h-5 text-gray-700" />
                  </button>
                  <button
                    onClick={(e) => handleDownload(document.id, e)}
                    className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
                  >
                    <Download className="w-5 h-5 text-gray-700" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
