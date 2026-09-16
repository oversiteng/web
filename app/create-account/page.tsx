import { Logo } from "../components/logo"
import { RegistrationHero } from "../components/registration-hero"
import { RegistrationForm } from "../components/registration-form"

export default function Page() {
  return (
    <div className="min-h-screen">
      {/* Mobile: stacked layout, Desktop: side-by-side */}
      <div className="w-full flex flex-col md:grid md:grid-cols-2 md:gap-0 min-h-screen">
        <div className="flex flex-col items-start gap-8 md:gap-0 justify-around order-1 md:order-1 bg-[#ECF4F1] pt-[3.188rem] md:pt-0 pl-4 md:pl-[4.063rem] pr-4 pb-[2.813rem] md:pb-0">
          <Logo />
          <RegistrationHero className={"max-w-[30.625rem]"} />
        </div>

        <div className="order-2 md:order-2 bg-white flex flex-col items-center justify-around h-full  md:overflow-y-auto">
          <div className=" rounded-xl p-6 md:p-8 pb-12 min-h-[43.75rem] max-w-[30.375rem]">
            <h2 className="text-[1.75rem] text-[#212A3B] font-semibold mb-6">Let's get you started!</h2>
            <RegistrationForm />
          </div>
        </div>
      </div>
    </div>
  )
}