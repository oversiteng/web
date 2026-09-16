"use client"

import type React from "react"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Logo } from "../components/logo"
import Mail_Icon from "../assets/mail.svg"
import Image from "next/image"
import { useLayoutContext } from "../ProviderLayout"
import { send_verification_code_mail, verify_otp_code } from "@/app/utils/api"
import { useState, useRef, useEffect } from "react"

export default function Page() {
  const { user } = useLayoutContext()
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()

  const resendVerificationCode = async () => {
    try {
      await send_verification_code_mail({ email: user.email })
    } catch (err) {
      console.log(err)
    }
  }

  const handleInputChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all fields are filled
    if (newCode.every((digit) => digit !== "") && value) {
      handleSubmit(newCode.join(""))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }

    // Handle arrow keys
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)

    if (pastedData.length > 0) {
      const newCode = [...code]
      for (let i = 0; i < 6; i++) {
        newCode[i] = pastedData[i] || ""
      }
      setCode(newCode)

      // Focus the next empty input or the last input
      const nextEmptyIndex = newCode.findIndex((digit) => digit === "")
      const focusIndex = nextEmptyIndex === -1 ? 5 : Math.min(nextEmptyIndex, 5)
      inputRefs.current[focusIndex]?.focus()

      // Auto-submit if all fields are filled
      if (newCode.every((digit) => digit !== "")) {
        handleSubmit(newCode.join(""))
      }
    }
  }

  const handleSubmit = async (verificationCode: string) => {
    setIsLoading(true)
    try {
      const { status } = await verify_otp_code({ email: user?.email || "abmercy035@gmail.com", code: verificationCode })
      if (status === 200)
        router.push(`${user.account_level}/dashboard`)
    }
    catch (err) {
      console.log("Verification failed:", err)
      // Reset the code on error
      setCode(["", "", "", "", "", ""])
      inputRefs.current[0]?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  return (
    <div className="min-h-screen bg-[#F6F9FC] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Logo />
        <div className="md:bg-[#FFFFFF] md:min-w-[32.25rem] rounded-4xl md:shadow-lg md:shadow-[#1E1E1E05] md:border md:border-[#E9EAEB] p-6 md:p-8 flex flex-col gap-6">
          <Image src={Mail_Icon || "/placeholder.svg"} width={96} height={66} alt="mail" className="m-auto" />

          <div className="text-center mb-6 max-w-[28.25rem] md:p-8">
            <h1 className="text-[1.75rem] font-semibold text-gray-900 mb-2">Enter Verification Code</h1>
            <p className="text-[#474E5C] leading-[1.875rem] text-sm font-normal md:text-[1.125rem]">
              We have sent a 6-digit verification code to
            </p>
            <p className="text-[#474E5C] leading-[1.875rem] italic text-sm font-normal md:text-[1.125rem]">
              <Link href={`mailto:${user?.email || "hello@oversite.com"}`} className="text-[#448C74]">
                {user?.email || "hello@oversite.com"}
              </Link>
            </p>
          </div>

          {/* 6-digit code input */}
          <div className="flex justify-center gap-3 mb-6">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                disabled={isLoading}
                className={`
                  w-12 h-12 text-center text-[#474E5C] text-xl font-semibold border-2 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-[#448C74] focus:border-[#448C74]
                  transition-all duration-200
                  ${digit ? "border-[#448C74] bg-[#F0F9F6]" : "border-[#E9EAEB]"}
                  ${isLoading ? "opacity-50 cursor-not-allowed" : "hover:border-[#448C74]"}
                `}
                aria-label={`Digit ${index + 1}`}
              />
            ))}
          </div>

          {isLoading && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-[#448C74]">
                <div className="w-4 h-4 border-2 border-[#448C74] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium">Verifying...</span>
              </div>
            </div>
          )}

          <div className="text-center">
            <p className="text-base text-[#212A3B] font-normal">
              Didn't receive the code?{" "}
              <button
                onClick={resendVerificationCode}
                disabled={isLoading}
                className="text-[#306251] cursor-pointer hover:text-[#264d40] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Resend
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
