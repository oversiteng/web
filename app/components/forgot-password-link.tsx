import Link from "next/link"

export function ForgotPasswordLink() {
  return (
    <div className="text-left">
      <Link href="/forgot-password" className="text-sm md:text-base font-medium text-[#306251] hover:text-green-600 transition-colors">
        Forgot password
      </Link>
    </div>
  )
}
