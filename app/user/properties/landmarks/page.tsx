"use client"

import { useState } from "react"
import { PropertiesList } from "@/app/components/dashboard/properties-list"
import { useLayoutContext } from "@/app/ProviderLayout"
import { Sidebar } from "@/app/components/dashboard/sidebar"
import { Header } from "@/app/components/dashboard/header"
import { Property } from "@/libs/interface"

export default function PropertiesPage() {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
	const { user } = useLayoutContext();

	const properties: Property[] = [
		{
			id: "1",
			name: "Green Land Estate 1",
			type: "Land",
			buildingType: "Terrace",
			dateCreated: "Apr 21, 2024",
		},
		{
			id: "2",
			name: "Green Land Estate 2",
			type: "Land",
			buildingType: "Terrace",
			dateCreated: "Apr 21, 2024",
		},
		{
			id: "3",
			name: "Green Land Estate 3",
			type: "Land",
			buildingType: "Terrace",
			dateCreated: "Apr 21, 2024",
		},
	]
	const dynamicRoute = (id: any) => {
		return `/user/properties/landmarks/${id}`
	}

	return (
		<div className="flex h-screen bg-gray-50">
			<Sidebar className="hidden lg:block" />

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
					<PropertiesList isMobile={false} properties={properties} dynamicRoute={dynamicRoute} />
				</main>
			</div>
		</div>
	)
}
