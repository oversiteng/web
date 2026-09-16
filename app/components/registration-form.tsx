"use client"

import type React from "react"

import { useState } from "react"
import { InputField } from "./input-field"
import { PasswordField } from "./password-field"
import { PhoneInput } from "./phone-input"
import { TermsCheckbox } from "./terms-checkbox"
import Link from "next/link"
import { SignInButton } from "./sign-in-button"
import { useLayoutContext } from "@/app/ProviderLayout";

import { useRouter } from "next/navigation"
import { create_account, send_verification_code_mail } from "@/app/utils/api"
interface FormErrors {
  first_name?: string
  last_name?: string
  username?: string
  email?: string
  phone?: string
  password?: string
}
export function RegistrationForm() {
  const { updateUserData } = useLayoutContext();

  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    phone: "",
    countryCode: "+234",
    accountType: "user",
    password: "",
    agreeToTerms: false,
  })
  const router = useRouter()

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {}

    if (!formData.first_name.trim()) {
      newErrors.first_name = "Please enter First name"
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = "Please enter Last name"
    }

    if (!formData.username.trim()) {
      newErrors.username = "This username is empty in use."
    }

    if (!formData.email.trim()) {
      newErrors.email = "Please enter Email address"
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address"
    }
    if (!/^\d{7,15}$/.test(formData.phone.trim())) {
      newErrors.phone = "Please enter a valid phone number"
    }

    if (formData.password.length < 8) {
      newErrors.password = "Passwords must be at least 8 characters long."
    }

    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const formErrors = validateForm()
    setErrors(formErrors)

    setIsLoading(true)

    if (Object.keys(formErrors).length > 0) {
      setIsLoading(false)
      return
    }
    try {
      const { data, status } = await create_account({ ...formData, phone: formData.countryCode + formData.phone });
      const result = await updateUserData(data)
      console.log(result)
      if (status == 201) {
        const { status } = await send_verification_code_mail({ email: result.user.email })
        if (status === 200) router.push(`/verify-code`)
      }
    }
    catch (err: Record<string, string> | any) {
      console.log(err)
      if (err.errors) {
        const backendErrors: FormErrors = {};
        Object.entries(err.errors).forEach(([key, value]) => {
          if (Array.isArray(value) && value.length > 0) {
            backendErrors[key as keyof FormErrors] = value[0];
          }
        });
        setErrors(backendErrors);
        setIsLoading(false);
        return;
      }
    }
    finally {
      setIsLoading(false)
    }
  }

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="First Name"
          type="text"
          value={formData.first_name}
          onChange={(e) => updateFormData("first_name", e.target.value)}
          error={errors.first_name}
        />

        <InputField
          label="Last Name"
          type="text"
          value={formData.last_name}
          onChange={(e) => updateFormData("last_name", e.target.value)}
          error={errors.last_name}
        />
      </div>

      <InputField
        label="Username"
        type="text"
        value={formData.username}
        onChange={(e) => updateFormData("username", e.target.value)}
        error={errors.username}
      />

      <InputField
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => updateFormData("email", e.target.value)}
        placeholder="hello@oversite.com"
        error={errors.email}
      />

      <PhoneInput
        value={formData.phone}
        onChange={(value) => updateFormData("phone", value)}
        countryCode={formData.countryCode}
        onCountryCodeChange={(code) => updateFormData("countryCode", code)}
        error={errors.phone}
      />

      <PasswordField
        label="Password"
        value={formData.password}
        onChange={(e) => updateFormData("password", e.target.value)}
        placeholder="Password (min. 8 characters)"
        error={errors.password}
      />

      <TermsCheckbox checked={formData.agreeToTerms} onChange={(checked) => updateFormData("agreeToTerms", checked)} />

      <SignInButton label="Create account" isLoadingText="Create account..." isLoading={isLoading} disabled={isLoading || !formData.agreeToTerms} />

      <div className="text-center">
        <p className="text-sm text-[#212A3B]">
          Have an account?{" "}
          <Link href="/login" className="text-[#306251] hover:text-green-700 font-medium">
            Log in
          </Link>
        </p>
      </div>
    </form>
  )
}
