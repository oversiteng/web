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
			name: "Banana Villa",
			type: "Land",
			buildingType: "Duplex",
			dateCreated: "Jul 21, 2023",
			status: "assigned",
		},
		{
			id: "2",
			name: "Ocean Breeze",
			type: "Building",
			buildingType: "Condo",
			dateCreated: "Aug 15, 2023",
			status: "assigned",
		},
		{
			id: "3",
			name: "Mountain Retreat",
			type: "Land",
			buildingType: "Cabin",
			dateCreated: "Sep 05, 2023",
			status: "assigned",
		},
		{
			id: "4",
			name: "Urban Loft",
			type: "Building",
			buildingType: "Apartment",
			dateCreated: "Oct 10, 2023",
			status: "assigned",
		},
		{
			id: "5",
			name: "Countryside Cottage",
			type: "Building",
			buildingType: "Bungalow",
			dateCreated: "Oct 22, 2023",
			status: "assigned",
		},
		{
			id: "6",
			name: "Countryside Cottage",
			type: "Building",
			buildingType: "Bungalow",
			dateCreated: "Oct 22, 2023",
			status: "assigned",
		},
	]
	const dynamicRoute = (id: any) => {
		return `/user/properties/property-value/${id}`
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

			<div className="flex-1 flex flex-col overflow-hidden">
				<Header onMenuClick={() => setIsMobileMenuOpen(true)} isMobile={true} user={user} />
				<main className="flex-1 overflow-auto p-4 lg:p-6">
					<PropertiesList isMobile={false} properties={properties} dynamicRoute={dynamicRoute} />
				</main>
			</div>
		</div>
	)
}
