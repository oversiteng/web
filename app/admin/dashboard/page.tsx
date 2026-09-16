"use client"

import "./dashboard.css"
import { useState } from "react"
import { Sidebar } from "../../components/dashboard/admin/sidebar"
import { Header } from "../../components/dashboard/header"
import { WelcomeSection } from "../../components/dashboard/agent/welcome-section"
import { StatsCards } from "../../components/dashboard/admin/stats-card"
import {AdminChart} from "../../components/dashboard/admin/admin-chart"
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
					<WelcomeSection />
					<StatsCards />
					<AdminChart />
				</main>
			</div>
		</div>
	)
}
