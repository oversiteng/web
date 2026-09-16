"use client"

import { Header } from "@/app/components/dashboard/header"
import Landmarks from "@/app/components/dashboard/landmarks"
import { Sidebar } from "@/app/components/dashboard/sidebar"
import { useLayoutContext } from "@/app/ProviderLayout"

import { useState } from "react"

export default function PropertyPage() {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
	const { user } = useLayoutContext()

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
				<main className="flex-1 overflow-auto p-4 lg:p-4">
					<Landmarks />
				</main>
			</div>
		</div>
	)
}
