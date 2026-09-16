"use client"

import type React from "react"

import { useState } from "react"
import { InputField } from "./input-field"
import { PasswordField } from "./password-field"
import { SignInButton } from "./sign-in-button"
import { ForgotPasswordLink } from "./forgot-password-link"
import { useRouter } from "next/navigation"
import { login_account } from "../utils/api"
import { useLayoutContext } from "../ProviderLayout"
interface FormErrors {
  email?: string
  password?: string
  login?: string
}
export function LoginForm() {
  const { user } = useLayoutContext()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const [formData, setFormData] = useState({
    username: "hello@oversite.com",
    password: "",
  })
  const router = useRouter()
  const { updateUserData } = useLayoutContext();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, status } = await login_account(formData);
      await updateUserData(data);
      if (status === 200) {
        const accountLevel = data?.user?.account_level || "user";
        router.push(`/${accountLevel}/dashboard`);
      }
    }

    catch (err: Record<string, string> | any) {
      console.log(err)
      if (err.status === 403) return router.push(`/verify-code`)
      if (err.status === 401) return setErrors({ login: err.message })
      if (!err.status) return setErrors({ login: err.message })
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      <div className="gap-4 flex flex-col">
        {errors.login && <div className="sticky bg-[#FC3B3B] px-4 py-2 z-20 rounded-lg md:right-6 right-4 -top-2"> {errors.login}</div>
        }
        <InputField
          label="Username"
          type="email"
          value={formData.username}
          onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
          placeholder="hello@oversite.com"
          required
          error={errors.email}
        />

        <PasswordField
          label="Password"
          value={formData.password}
          onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
          placeholder="Enter your password"
          required
          error={errors.password}

        />
      </div>
      <ForgotPasswordLink />

      <SignInButton label="Sign in" isLoadingText="signing in..." isLoading={isLoading} />
    </form>
  )
}
