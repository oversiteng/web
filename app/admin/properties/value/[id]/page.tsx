"use client"

import { useState, useEffect } from "react"
import PropertyValueDetails from "@/app/components/dashboard/admin/property-value-details"
import { Sidebar } from "@/app/components/dashboard/admin/sidebar"
import { Header } from "@/app/components/dashboard/header"
// import "../../../../dashboard/dashboard.css"
import { useLayoutContext } from "@/app/ProviderLayout"
export default function Page() {
	const [isMobile, setIsMobile] = useState(false)
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
	const { user } = useLayoutContext()

	useEffect(() => {
		const checkScreenSize = () => {
			setIsMobile(window.innerWidth < 768)
		}

		checkScreenSize()
		window.addEventListener("resize", checkScreenSize)

		return () => window.removeEventListener("resize", checkScreenSize)
	}, [])

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

			<div className="flex-1 flex flex-col overflow-scroll relative">
				<Header onMenuClick={() => setIsMobileMenuOpen(true)} isMobile={true} user={user} />
				<PropertyValueDetails isMobile={isMobile} />

			</div>
		</div>
	)
}
