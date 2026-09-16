"use client"

import type React from "react"

import { useState, forwardRef } from "react"

interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label, error, className = "", ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="relative">
          <input
            ref={ref}
            type={showPassword ? "text" : "password"}
            className={`w-full text-black max-h-[2.75rem] px-3 py-3 md:py-4 rounded-lg focus:outline-none placeholder-[#A4A8AF] font-normal text-sm md:text-base ${
              error ? "border-2 border-red-500 focus:border-red-500" : "border border-[#D0D5DD] focus:border-green-500"
            } ${className}`}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#306251] hover:text-gray-700 focus:outline-none text-base font-medium cursor-pointer"
          >
            {showPassword ? "Hide" : "Show"}
            <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
          </button>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    )
  },
)

PasswordField.displayName = "PasswordField"
