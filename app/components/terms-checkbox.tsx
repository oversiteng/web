"use client"

import Link from "next/link"

interface TermsCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
}

export function TermsCheckbox({ checked, onChange }: TermsCheckboxProps) {
  return (
    <div className="flex items-start space-x-2">
      <div className="flex items-center h-5">
        <input
          id="terms"
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4  rounded accent-[#306251] border-[#306251] border"
        />
      </div>
      <div className="text-sm">
        <label htmlFor="terms" className="text-gray-700">
          I have read, understood and I agree to oversite&apos;{" "}
          <Link href="/privacy-policy" className="text-[#306251] font-medium underline">
            Privacy Policy
          </Link>
          , and{" "}
          <Link href="/terms" className="text-[#306251] underline font-medium">
            Terms and conditions
          </Link>
          .
        </label>
      </div>
    </div>
  )
}
