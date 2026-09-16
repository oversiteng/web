"use client"

import type React from "react"
import { useState } from "react"
import { InputField } from "./input-field"
import { SignInButton } from "./sign-in-button"
import { forgot_password } from "../utils/api"
import { useRouter } from "next/navigation"

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
  })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const { status } = await forgot_password(formData);
      if (status === 200) {
        router.push("/create-new-password")
      }
    }
    catch (err) {
      console.log(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      <div className="gap-4 flex flex-col">
        <InputField
          label="Email address"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
          placeholder="hello@oversite.com"
          required />
      </div>
      <SignInButton label="Continue" isLoadingText="Sending..." isLoading={isLoading} />
    </form>
  )
}
