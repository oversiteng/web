import Link from "next/link";
import { Logo } from "../components/logo";
import Mail_Icon from "@/app/assets/mail.svg"
import Image from "next/image";
export default function Page() {
  return (
    <div className="min-h-screen bg-[#F6F9FC] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Logo />
        <div className="md:bg-[#FFFFFF] md:min-w-[32.25rem] rounded-4xl md:shadow-lg md:shadow-[#1E1E1E05] md:border md:border-[#E9EAEB] p-6 md:p-8 flex flex-col gap-6">
          <Image src={Mail_Icon} width={96} height={66} alt="mail" className="m-auto" />
          <div className="text-center mb-6 max-w-[28.25rem] md:p-8 ">
            <h1 className="text-[1.75rem] font-semibold text-gray-900 mb-2">Verify Mail</h1>
            <p className="text-[#474E5C] leading-[1.875rem] text-sm font-normal md:text-[1.125rem]">We have sent a verification link to
            </p>
            <p className="text-[#474E5C] leading-[1.875rem] italic text-sm font-normal md:text-[1.125rem]"><Link href="mailto:hello@oversite.com" className="text-[#448C74]"> hello@oversite.com </Link>, kindly check your mail to proceed
            </p>
          </div>
          <div className="text-center">
            <p className="text-base text-[#212A3B] font-normal">
              Didn't receive mail?{" "}
              <Link href="/create-account" className="text-[#306251] hover:text-[#264d40] font-medium transition-colors">
                Resend
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>

  )
}
