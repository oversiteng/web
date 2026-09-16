"use client"

import "./dashboard.css"
import { useState } from "react"
import { Sidebar } from "../../components/dashboard/agent/sidebar"
import { Header } from "../../components/dashboard/header"
import { WelcomeSection } from "../../components/dashboard/agent/welcome-section"
import { StatsCards } from "../../components/dashboard/agent/stats-card"
import PropertiesList from "../../components/dashboard/agent/properties-list"
import { useLayoutContext } from "@/app/ProviderLayout"


export default function DashboardPage() {
	const { user } = useLayoutContext()
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

	return (
		<div className="flex h-screen bg-gray-50">
			{/* Desktop Sidebar */}
			<Sidebar className="hidden lg:block" />
			
			{/* Mobile Sidebar Overlay */}
			{isMobileMenuOpen && (
				<div className="fixed inset-0 z-50 lg:hidden">
					<div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
					<Sidebar className="relative z-50" onClose={() => setIsMobileMenuOpen(false)} showCloseButton={true} />
				</div>
			)}

			{/* Main Content */}
			<div className="flex-1 flex flex-col overflow-hidden">
				<Header onMenuClick={() => setIsMobileMenuOpen(true)} isMobile={true} user={user} />

				<main className="flex-1 overflow-auto p-4 lg:p-6">
					{/* KYC Notification Banner - Mobile */}
					<div className="mb-6">
						<div className="flex max-md:flex-col items-start md:items-center justify-between bg-[#171D29] rounded-lg py-6 px-4 text-black">
							<div className="">
								<h3 className="text-lg font-semibold mb-2 text-[#FFFFFF]">Complete your profile verification</h3>
								<p className="text-sm text-[#ffffff] mb-4">
									Your account is currently pending. Please upload the necessary documents to gain full access to the
									system.
								</p>
							</div>
							<button className="bg-[#ffffff] text-[#344054] py-[0.625rem] px-[0.625rem] rounded-lg font-medium hover:bg-gray-100 border border-[#D0D5DD] transition-colors">
								Complete KYC
							</button>
						</div>
					</div>
					<WelcomeSection />
					<StatsCards />
					<PropertiesList />
				</main>
			</div>
		</div>
	)
}
