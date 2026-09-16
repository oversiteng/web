"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  countryCode: string
  onCountryCodeChange: (code: string) => void
  className?: string
  placeholder?: string
  required?: boolean
  error?: string
}

const countryCodes = [
  { code: "+234", country: "Nigeria" },
  { code: "+1", country: "United States" },
  { code: "+44", country: "United Kingdom" },
  { code: "+91", country: "India" },
  { code: "+86", country: "China" },
]

export function PhoneInput({
  value,
  onChange,
  countryCode,
  onCountryCodeChange,
  className = "",
  placeholder = "",
  required = false,
  error,
}: PhoneInputProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Phone Number</label>
      <div className="flex gap-2">
        <div className="relative">
          <button
            type="button"
            className={`flex items-center justify-between w-24 max-h-[2.75rem] font-medium px-4 py-3 md:py-4 rounded-lg focus:outline-none focus:ring-2 text-[#474E5C] focus:border-transparent bg-white ${
              error ? "border-2 border-red-500" : "border border-gray-300"
            }`}
            onClick={() => setIsOpen(!isOpen)}
          >
            <span>{countryCode}</span>
            <ChevronDown className="w-4 h-4 ml-1 text-black" />
          </button>

          {isOpen && (
            <div className="absolute z-10 w-40 mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
              <ul className="text-[#474E5C] py-1 max-h-60 overflow-auto">
                {countryCodes.map((country) => (
                  <li key={country.code}>
                    <button
                      type="button"
                      className="w-full px-4 py-2 text-left hover:bg-gray-100"
                      onClick={() => {
                        onCountryCodeChange(country.code)
                        setIsOpen(false)
                      }}
                    >
                      {country.code} {country.country}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`flex-1 max-h-[2.75rem] px-3 py-3 md:py-4 rounded-lg focus:outline-none text-black ${
            error ? "border-2 border-red-500 focus:border-red-500" : "border border-gray-300 focus:border-green-500"
          } ${className}`}
          placeholder={placeholder}
          required={required}
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  )
}
