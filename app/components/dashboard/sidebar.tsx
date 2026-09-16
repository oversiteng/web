"use client"

import { useState } from "react"
import Link from "next/link"
import {
	LayoutDashboard,
	Building2,
	Mail,
	ChevronDown,
	CreditCard,
	User,
	Shield,
	FileText,
	HelpCircle,
	LogOut,
	Lightbulb,
	X,
	MessageSquareText,
	File,
} from "lucide-react"
import Logo from "../../assets/images/logo.png"
import panelLeftOpenIcon from "../../assets/panel-left-open-icon.png"
import Image from "next/image"
import { useLayoutContext } from "@/app/ProviderLayout"


interface SidebarProps {
	className?: string
	onClose?: () => void
	showCloseButton?: boolean
}

export function Sidebar({ className = "", onClose, showCloseButton = false }: SidebarProps) {
	const [isPropertiesOpen, setIsPropertiesOpen] = useState(false)
const { logoutUserProfile} = useLayoutContext()
	return (
		<div className={`w-64 bg-white border-r border-gray-200 h-screen flex flex-col ${className}`}>
			{/* Logo */}
			<div className="p-4 ">
				<div className="flex items-center justify-between gap-2 ">
					<Image src={Logo} alt="logo" width={100} height={100} />
					<Image src={panelLeftOpenIcon} alt="logo" width={20} height={20} className={`cursor-pointer ${showCloseButton ? "hidden" : "hidden md:flex"}`} />
				</div>
			</div>

			{showCloseButton && (
				<button onClick={onClose} className="cursor-pointer absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg">
					<X className="w-5 h-5" />
				</button>
			)}

			{/* Navigation */}
			<nav className="flex-1 px-4">
				{/* Main Menu */}
				<div className="mb-6">
					<p className="text-xs font-medium text-[#A4A8AF] uppercase tracking-wider mb-3">MAIN MENU</p>
					<Link
						href="/user/dashboard"
						className="cursor-pointer flex items-center gap-3 max-h-[2.5rem] px-4 py-2 rounded-lg bg-[#448C74] text-white mb-2 text-[0.875rem]">
						<LayoutDashboard className="w-5 h-5 text-[white]" />
						<span className="font-medium">Dashboard</span>
					</Link>

					<div className="mb-2">
						<button
							onClick={() => setIsPropertiesOpen(!isPropertiesOpen)}
							className="cursor-pointer flex items-center justify-between w-full px-3 py-2 rounded-lg text-[#7E838D] hover:bg-gray-100">
							<div className="flex items-center gap-3 max-h-[2.5rem] text-[0.875rem]">
								<Building2 className="w-5 h-5 hover:text-[white]" />
								<span>My Properties</span>
							</div>
							<ChevronDown className={`w-4 h-4 transition-transform ${isPropertiesOpen ? "rotate-180" : ""}`} />
						</button>

						{isPropertiesOpen && (
							<div className="ml-6 pl-4 mt-2 flex flex-col gap-[0.625rem] border-l border-[#E9EAEB]">
								<Link
									href="/user/properties/listings"
									className="block min-h-[1.25rem] text-sm font-medium text-[#448C74]">
									My Listing
								</Link>
								<Link
									href="/user/properties/timeline/reviews"
									className="block min-h-[1.25rem] text-sm text-[#7E838D] hover:bg-gray-50"
								>
									Expert Reviews
								</Link>
								<Link
									href="/user/properties/timeline/policy-updates"
									className="block min-h-[1.25rem] text-sm text-[#7E838D] hover:bg-gray-50"
								>
									State Policy Updates
								</Link>
								<Link
									href="/user/properties/timeline/community-updates"
									className="block min-h-[1.25rem] text-sm text-[#7E838D] hover:bg-gray-50"
								>
									Community update
								</Link>
								<Link
									href="/user/properties/timeline/word-on-street"
									className="block min-h-[1.25rem] text-sm text-[#7E838D] hover:bg-gray-50"
								>
									Word on the Street
								</Link>
								<Link
									href="/user/properties/vulnerability-test"
									className="block min-h-[1.25rem] text-sm text-[#7E838D] hover:bg-gray-50"
								>
									Request Vulnerability Test
								</Link>
							</div>
						)}
					</div>

					<Link
						href="/user/message"
						className="cursor-pointer flex items-center gap-3 max-h-[2.5rem] px-4 py-2 rounded-lg text-[#7E838D] hover:bg-gray-100 mb-2 text-[0.875rem]"
					>
						<MessageSquareText className="w-5 h-5 hover:text-[white]" />
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
						href="/user/subscription"
						className="cursor-pointer flex items-center gap-3 max-h-[2.5rem] px-4 py-2 rounded-lg text-[#7E838D] hover:bg-gray-100 mb-2 text-[0.875rem]"
					>
						<CreditCard className="w-5 h-5 hover:text-[white]" />
						<span>Manage Subscription</span>
					</Link>

					<Link
						href="/user/account"
						className="cursor-pointer flex items-center gap-3 max-h-[2.5rem] px-4 py-2 rounded-lg text-[#7E838D] hover:bg-gray-100 mb-2 text-[0.875rem]"
					>
						<User className="w-5 h-5 hover:text-[white]" />
						<span>Account</span>
					</Link>
				</div>

				{/* Support & Policies */}
				<div className="mb-6">
					<p className="text-xs font-medium text-[#A4A8AF] uppercase tracking-wider mb-3">SUPPORT & POLICIES</p>

					<Link
						href="/privacy"
						className="cursor-pointer flex items-center gap-3 max-h-[2.5rem] px-4 py-2 rounded-lg text-[#7E838D] hover:bg-gray-100 mb-2 text-[0.875rem]"
					>
						<Shield className="w-5 h-5 hover:text-[white]" />
						<span>Privacy & Security</span>
					</Link>

					<Link
						href="/terms"
						className="cursor-pointer flex items-center gap-3 max-h-[2.5rem] px-4 py-2 rounded-lg text-[#7E838D] hover:bg-gray-100 mb-2 text-[0.875rem]"
					>
						<File className="w-5 h-5 hover:text-[white]" />
						<span>Terms of Service</span>
					</Link>

					<Link
						href="/help"
						className="cursor-pointer flex items-center gap-3 max-h-[2.5rem] px-4 py-2 rounded-lg text-[#7E838D] hover:bg-gray-100 mb-2 text-[0.875rem]"
					>
						<HelpCircle className="w-5 h-5 hover:text-[white]" />
						<span>Help Center</span>
					</Link>
				</div>
			</nav>

			<div className="cursor-pointer flex flex-col justify-end px-4">
				<button className="flex cursor-pointer items-center gap-3 max-h-[2.5rem] border-t px-4 py-8 border-[#E9EAEB] text-[#7E838D] hover:bg-[#E9EAEB] w-full" onClick={logoutUserProfile}>
					<LogOut className="w-5 h-5 hover:text-[white]" />
					<span>Log out</span>
				</button>
			</div>

			{/* Upgrade Card */}
			<div className="p-4">
				<div className="bg-[#306251] rounded-lg p-4 text-white upgrade-card-wrapper">
					<div className="rounded-lg p-4 text-white upgrade-card"></div>
					<div className="flex items-center gap-2 mb-2">
						<Lightbulb className="w-5 h-5 hover:text-[white]" />
					</div>
					<p className="text-sm font-medium mb-1">Get detailed property information, upgrade to pro</p>
					<button className="bg-white text-[#448C74] text-sm font-medium px-3 py-1 rounded mt-2">Upgrade to pro</button>
				</div>
			</div>
		</div>
	)
}

