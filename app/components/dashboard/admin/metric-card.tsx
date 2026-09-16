"use client"

import { ChevronDown } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string | number
  hasDetails?: boolean
  hasDropdown?: boolean
  dropdownValue?: string
  onDetailsClick?: () => void
  className?: string
}

export function MetricCard({
  title,
  value,
  hasDetails = false,
  hasDropdown = false,
  dropdownValue,
  onDetailsClick,
  className = "",
}: MetricCardProps) {
  return (
    <div className={`bg-white rounded-lg border p-6 flex flex-col justify-around  ${className}`}>
      <h3 className={"text-[#474E5C] text-base font-normal"}>{title}</h3>
      <div className={`text-[1.75rem] font-medium text-[#212A3B]${ !hasDetails && "text-[2.375rem] text-[#295547]!"}`}>{value}</div>

      {hasDetails && hasDropdown && (
        <div className="flex items-center justify-between border-t pt-2">

          <button
            onClick={onDetailsClick}
            className="cursor-pointer text-[#306251] text-sm font-normal flex items-center gap-1"
          >
            See details
            <span>→</span>
          </button>


          <button className="cursor-pointer text-[#474E5C] text-sm font-normal flex items-center gap-1">
            {dropdownValue}
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
