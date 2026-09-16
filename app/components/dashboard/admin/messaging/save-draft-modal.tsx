"use client"

import { Info } from "lucide-react"

interface SaveDraftModalProps {
  isOpen: boolean
  onCancel: () => void
  onContinue: () => void
}

export function SaveDraftModal({ isOpen, onCancel, onContinue }: SaveDraftModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-[#171D2933] bg-opacity-50 backdrop-blur-sm"  onClick={onCancel}/>
      <div className="relative bg-white rounded-lg p-6 w-full max-w-[28.875rem] mx-4">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-10 h-10 bg-[#306251] rounded-full flex items-center justify-center flex-shrink-0">
            <Info className="w-5 h-5 text-[#fff]" />
          </div>
          <div>
            <h2 className="text-[1.125rem] font-semibold text-[#0F172A] mb-1">Save message as draft</h2>
            <p className="text-[#64748B]">Your message will be saved as a draft.</p>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="cursor-pointer px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium w-[5.563rem]"
          >
            Cancel
          </button>
          <button
            onClick={onContinue}
            className="cursor-pointer px-4 py-3 bg-[#448C74] w-[6.625rem] text-white rounded-lg font-medium"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
    // </div>
  )
}
