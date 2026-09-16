interface RegistrationHeroProps {
  className?: string
}

export function RegistrationHero({ className = "" }: RegistrationHeroProps) {
  return (
    <div className={`flex flex-col gap-8 md:gap-6 ${className}`}>
      <h1 className="text-[1.313rem] md:text-4xl font-semibold text-[#295547]">
        Take Control of Your Property, Anytime, Anywhere!
      </h1>
      <p className="text-[#474E5C] font-normal md:text-lg text-sm">
       From wherever you are, manage your properties, get real time updates with ease using our user-friendly dashboard.
      </p>
    </div>
  )
}
