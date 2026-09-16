import { Logo } from "../components/logo"
import { LoginForm } from "../components/login-form"
import { WelcomeHeader } from "../components/welcome.-header"
import { CreateAccountLink } from "../components/create-account-link"
import { CreateNewPasswordForm } from "../components/create-new-password-form"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F6F9FC] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Logo />

        <div className="md:bg-[#FFFFFF] rounded-4xl md:shadow-lg md:shadow-[#1E1E1E05] md:border md:border-[#E9EAEB] p-6 md:p-8">
          <div className="text-left mb-6 md:mb-8">
            <h1 className="text-[1.125rem] md:text-[1.313rem] font-semibold text-gray-900 mb-2">Create New Password?</h1>
            <p className="text-[#212A3B] text-sm font-normal md:text-[1.125rem]">Enter a new password</p>
          </div>
          <CreateNewPasswordForm />
        </div>

        <div className="mt-6">
          <div className="text-center">
            <p className="text-base text-[#212A3B] font-normal">
              <Link href="/create-account" className="text-[#306251] hover:text-[#264d40] font-medium transition-colors">
              Return to Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
