"use client"

import Link from "next/link"
import {
	LayoutDashboard,
	Building2,
	CreditCard,
	User,
	Shield,
	HelpCircle,
	LogOut,
	Lightbulb,
	X,
	MessageSquareText,
	File,
} from "lucide-react"
import Logo from "@/app/assets/images/logo.png"
import panelLeftOpenIcon from "@/app/assets/panel-left-open-icon.png"
import Image from "next/image"
import { useLayoutContext } from "@/app/ProviderLayout"


interface SidebarProps {
	className?: string
	onClose?: () => void
	showCloseButton?: boolean
}

export function Sidebar({ className = "", onClose, showCloseButton = false }: SidebarProps) {
	const { logoutUserProfile } = useLayoutContext()

	return (
		<div className={`w-64 bg-white border-r border-gray-200 h-screen flex flex-col ${className}`}>
			{/* Logo */}
			<div className="p-4 ">
				<div className="flex items-center justify-between gap-2 ">
					<Image src={Logo} alt="s" width={100} height={100} />
					<Image src={panelLeftOpenIcon} alt="s" width={20} height={20} className={`cursor-pointer ${showCloseButton ? "hidden" : "hidden md:flex"}`} />
				</div>
			</div>

			{showCloseButton && (
				<button onClick={onClose} className="cursor-pointer absolute top-4 right-4 p-2 hover:bg-[#448C74] hover:text-[#fff] rounded-lg border border-[#D0D5DD] text-[#000000]">
					<X className="w-5 h-5" />
				</button>
			)}

			{/* Navigation */}
			<nav className="flex-1 px-4">
				{/* Main Menu */}
				<div className="mb-6">
					<p className="text-xs font-medium text-[#A4A8AF] uppercase tracking-wider mb-3">MAIN MENU</p>
					<Link
						href="/agent/dashboard"
						className="flex items-center gap-3 max-h-[2.5rem] px-4 py-2 rounded-lg bg-[#448C74] text-white mb-2 text-[0.875rem]">
						<LayoutDashboard className="w-5 h-5 text-[white]" />
						<span className="font-medium">Dashboard</span>
					</Link>
					<Link
						href="/agent/properties/listings"
						className="flex items-center gap-3 max-h-[2.5rem] px-4 py-2 rounded-lg hover:bg-[#448C74] hover:text-[white] text-[#7E838D] mb-2 text-[0.875rem]">
						<Building2 className="w-5 h-5" />
						<span className="font-medium">Properties Listing</span>
					</Link>
					<Link
						href="/agent/message"
						className="flex items-center gap-3 max-h-[2.5rem] px-4 py-2 rounded-lg hover:bg-[#448C74] hover:text-[white] text-[#7E838D] mb-2 text-[0.875rem]"
					>
						<MessageSquareText className="w-5 h-5" />
						<span>Inbox</span>
						<span className="ml-auto bg-[#448C74] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
							3
						</span>
					</Link>
				</div>

				{/* Account Management */}
				<div className="mb-6 border-y border-[#E9EAEB] py-4">
					<p className="text-xs font-medium text-[#A4A8AF] uppercase tracking-wider mb-3">ACCOUNT MANAGEMENT</p>

					<Link
						href="/agent/subscription"
						className="flex items-center gap-3 max-h-[2.5rem] px-4 py-2 rounded-lg hover:bg-[#448C74] hover:text-[white] text-[#7E838D] mb-2 text-[0.875rem]"
					>
						<CreditCard className="w-5 h-5" />
						<span>Manage Subscription</span>
					</Link>

					<Link
						href="/agent/account"
						className="flex items-center gap-3 max-h-[2.5rem] px-4 py-2 rounded-lg hover:bg-[#448C74] hover:text-[white] text-[#7E838D] mb-2 text-[0.875rem]"
					>
						<User className="w-5 h-5" />
						<span>Account</span>
					</Link>
				</div>

				{/* Support & Policies */}
				<div className="mb-6">
					<p className="text-xs font-medium text-[#A4A8AF] uppercase tracking-wider mb-3">SUPPORT & POLICIES</p>

					<Link
						href="/privacy"
						className="flex items-center gap-3 max-h-[2.5rem] px-4 py-2 rounded-lg hover:bg-[#448C74] hover:text-[white] text-[#7E838D] mb-2 text-[0.875rem]"
					>
						<Shield className="w-5 h-5" />
						<span>Privacy & Security</span>
					</Link>

					<Link
						href="/terms"
						className="flex items-center gap-3 max-h-[2.5rem] px-4 py-2 rounded-lg hover:bg-[#448C74] hover:text-[white] text-[#7E838D] mb-2 text-[0.875rem]"
					>
						<File className="w-5 h-5" />
						<span>Terms of Service</span>
					</Link>

					<Link
						href="/help"
						className="flex items-center gap-3 max-h-[2.5rem] px-4 py-2 rounded-lg hover:bg-[#448C74] hover:text-[white] text-[#7E838D] mb-2 text-[0.875rem]"
					>
						<HelpCircle className="w-5 h-5" />
						<span>Help Center</span>
					</Link>
				</div>
			</nav>

			<div className="flex flex-col justify-end px-4">
				<button onClick={logoutUserProfile} className="flex cursor-pointer items-center gap-3 max-h-[2.5rem] border-t px-4 py-8 border-[#E9EAEB] text-[#7E838D] hover:bg-[#E9EAEB] w-full">
					<LogOut className="w-5 h-5" />
					<span>Log out</span>
				</button>
			</div>

			{/* Upgrade Card */}
			<div className="p-4">
				<div className="bg-[#306251] rounded-lg p-4 text-white upgrade-card-wrapper">
					<div className="rounded-lg p-4 text-white upgrade-card"></div>
					<div className="flex items-center gap-2 mb-2">
						<Lightbulb className="w-5 h-5" />
					</div>
					<p className="text-sm font-medium mb-1">Get detailed property information, upgrade to pro</p>
					<button className="bg-white text-[#448C74] text-sm font-medium px-3 py-1 rounded mt-2">Upgrade to pro</button>
				</div>
			</div>
		</div>
	)
}

