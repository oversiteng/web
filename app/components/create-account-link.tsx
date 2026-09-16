import Link from "next/link"

export function CreateAccountLink() {
  return (
    <div className="text-center">
      <p className="text-base text-[#212A3B] font-normal">
        Don't have an account?{" "}
        <Link href="/create-account" className="text-[#306251] hover:text-[#264d40] font-medium transition-colors">
          Create an account
        </Link>
      </p>
    </div>
  )
}
