"use client"

import { useState } from "react"
import { Header } from "../../../components/dashboard/header"
import { useLayoutContext } from "@/app/ProviderLayout"
import { Sidebar } from "@/app/components/dashboard/agent/sidebar"
import PropertyListing from "@/app/components/dashboard/agent/properties-list"

export default function PropertiesPage() {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
	const { user } = useLayoutContext()

	return (
		<div className="flex h-screen bg-gray-50">
			{/* Desktop Sidebar */}
			<Sidebar  className="hidden lg:block" />

			{/* Mobile Sidebar Overlay */}
			{isMobileMenuOpen && (
				<div className="fixed inset-0 z-50 lg:hidden">
					<div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
					<Sidebar  className="relative z-50" onClose={() => setIsMobileMenuOpen(false)} showCloseButton={true} />
				</div>
			)}

			{/* Main Content */}
			<div className="flex-1 flex flex-col overflow-hidden">
				<Header onMenuClick={() => setIsMobileMenuOpen(true)} isMobile={true} user={user} />

				<main className="flex-1 overflow-auto p-4 lg:p-6">
					<PropertyListing isMobile={false} />
				</main>
			</div>
		</div>
	)
}
