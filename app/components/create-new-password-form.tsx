"use client"

import type React from "react"

import { useState } from "react"
import { PasswordField } from "./password-field"
import { SignInButton } from "./sign-in-button"
import { InputField } from "./input-field"
import { reset_password } from "../utils/api"
import { useRouter } from "next/navigation"

export function CreateNewPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    code: "",
    email: "",
    password: "",
    password_confirmation: "",
  })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const { status } = await reset_password(formData);
      if (status === 200) {
        router.push("/")
      }
    }
    catch (err) {
      console.log(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="gap-4 flex flex-col">
        <InputField
          label="6 Digit"
          inputMode="numeric"
          maxLength={6}
          value={formData.code}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            if (/^\d*$/.test(value)) {
              setFormData((prev) => ({ ...prev, code: value }));
            }
          }}
          placeholder="Enter your code"
          required
        />
        <InputField
          label="Email"
          value={formData.email}
          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
          placeholder="Enter email (min. 8 characters)"
          required
        />
        <PasswordField
          label="New Password"
          value={formData.password}
          onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
          placeholder="Enter new password (min. 8 characters)"
          required
        />
        <PasswordField
          label="Confirm Password"
          value={formData.password_confirmation}
          onChange={(e) => setFormData((prev) => ({ ...prev, password_confirmation: e.target.value }))}
          placeholder="Confirm new password (min. 8 characters)"
          required
        />
      </div>
      <SignInButton label="Continue" isLoadingText="signing in..." isLoading={isLoading} />
    </form>
  )
}
