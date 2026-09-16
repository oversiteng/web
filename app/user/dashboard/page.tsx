"use client"

import "./dashboard.css"
import { useState } from "react"
import { Sidebar } from "../../components/dashboard/sidebar"
import { Header } from "../../components/dashboard/header"
import { WelcomeSection } from "../../components/dashboard/welcome-section"
import { StatsCards } from "../../components/dashboard/stats-card"
import { PropertyChart } from "../../components/dashboard/property-chart"
import { MarketingBanner } from "../../components/dashboard/marketing-banner"
import { GlobalMap } from "../../components/dashboard/global-map"
import { useLayoutContext } from "@/app/ProviderLayout";


export default function DashboardPage() {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
	const { user, dashboard } = useLayoutContext();
	const { weather } = dashboard
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
				<Header user={user} onMenuClick={() => setIsMobileMenuOpen(true)} isMobile={true} />

				<main className="flex-1 overflow-auto p-4 lg:p-6">
					<WelcomeSection userName={user?.username!} weather={weather} />
					<StatsCards />
					<PropertyChart />
					<MarketingBanner />
					<GlobalMap />
				</main>
			</div>
		</div>
	)
}
