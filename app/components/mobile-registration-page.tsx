import { Logo } from "./logo"
import { RegistrationHero } from "./registration-hero"
import { RegistrationForm } from "./registration-form"

export default function MobileRegistrationPage() {
  return (
    <div className="min-h-screen bg-green-50 p-4">
      <Logo />

      <div className="mt-8 space-y-8">
        <RegistrationHero />

        <div>
          <h2 className="text-xl font-semibold mb-6">Let&apos;s get you started!</h2>
          <RegistrationForm />
        </div>
      </div>
    </div>
  )
}
