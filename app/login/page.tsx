import { Logo } from "../components/logo"
import { LoginForm } from "../components/login-form"
import { WelcomeHeader } from "../components/welcome.-header"
import { CreateAccountLink } from "../components/create-account-link"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F6F9FC] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Logo />

        <div className="md:bg-[#FFFFFF] rounded-4xl md:shadow-lg md:shadow-[#1E1E1E05] md:border md:border-[#E9EAEB] p-6 md:p-8">
          <WelcomeHeader />
          <LoginForm />
        </div>

        <div className="mt-6">
          <CreateAccountLink />
        </div>
      </div>
    </div>
  )
}
