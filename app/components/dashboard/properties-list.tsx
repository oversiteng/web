"use client"

import { useState } from "react"
import { ChevronRight, Plus, List, Grid3X3, ChevronLeft, TvMinimal } from "lucide-react"
import { useRouter } from "next/navigation"
import { PropertyCard } from "./properties-card"
import { Property } from "@/libs/interface"
import { BackNavButton } from "../backNavButton"


interface PropertiesListProps {
	isMobile?: boolean
	properties: Property[]
	dynamicRoute: (id: string) => string
}

export function PropertiesList({ isMobile = false, properties, dynamicRoute }: PropertiesListProps) {
	const [viewMode, setViewMode] = useState<"table" | "card" | "media">("table")
	const router = useRouter()

	// Helper to get the current pathname
	const pathname = typeof window !== "undefined" ? window.location.pathname.split("/").filter(Boolean).pop() || "" : ""


	// Mobile always uses card view
	const currentViewMode = isMobile ? "card" : viewMode

	const handlePropertySelect = (propertyId: string) => {
		// console.log((pathname))
		router.push(dynamicRoute(propertyId))
	}

	return (
		<>
			<div className="">
				{/* Header */}
				<div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
					<div className="flex items-center gap-4 mb-4 md:mb-0">
						<BackNavButton />
						<nav className="text-sm text-[#7E838D]">
							<span>My Properties</span>
							<span className="mx-2">/</span>
							<span className="max-w-[140px] truncate inline-block align-bottom" title={pathname}>
								{pathname}
							</span>
						</nav>
					</div>

					<button className="bg-[#448C74] text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium">
						<Plus className="w-4 h-4" />
						Add a property
					</button>
				</div>

				{/* Properties Listings Header */}
				<div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
					<div className="flex items-center gap-2 mb-4 md:mb-0">
						<h1 className="text-base font-medium text-[#212A3B]">Properties Listings</h1>
						<span className="bg-[#E9EAEB] text-[#000000] w-8 h-8 rounded-full flex items-center justify-center text-base font-medium">{properties.length}</span>
					</div>
					{!isMobile && (
						<div className="flex items-center gap-2">
							<span className="text-sm text-gray-600 mr-2">View</span>
							<div className="flex border border-gray-300 rounded-lg overflow-hidden">
								<button
									onClick={() => setViewMode("table")}
									className={`p-2 cursor-pointer ${viewMode === "table" ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50"}`}>
									<List className="w-4 h-4" />
								</button>
								<button
									onClick={() => setViewMode("card")}
									className={`p-2 cursor-pointer ${viewMode === "card" ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50"}`}>
									<Grid3X3 className="w-4 h-4" />
								</button>
								<button
									onClick={() => setViewMode("media")}
									className={`p-2 cursor-pointer ${viewMode === "card" ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50"}`}>
									<TvMinimal className="w-4 h-4" />
								</button>
							</div>
						</div>
					)}
				</div>

				{/* Content */}
				{currentViewMode === "table" && (
					/* Table View */
					<div className="overflow-x-auto bg-[#FFFFFF]">
						<table className="w-full">
							<thead>
								<tr className="border-b border-gray-200 h-14">
									<th className="text-left py-3 px-4 text-base font-medium text-[#7E838D]">S/N</th>
									<th className="text-left py-3 px-4 text-base font-medium text-[#7E838D]">Name</th>
									<th className="text-left py-3 px-4 text-base font-medium text-[#7E838D]">Type</th>
									<th className="text-left py-3 px-4 text-base font-medium text-[#7E838D]">Building Type</th>
									<th className="text-left py-3 px-4 text-base font-medium text-[#7E838D]">Date Created</th>
									<th className="text-left py-3 px-4 text-base font-medium text-[#7E838D]"></th>
								</tr>
							</thead>
							<tbody>
								{properties.map((property, index) => (
									<tr key={property.id} className="border-b border-gray-100 hover:bg-gray-50">
										<td className="py-4 px-4 text-[#212A3B]">{index + 1}</td>
										<td className="py-4 px-4 text-[#212A3B]">{property.name}</td>
										<td className="py-4 px-4 text-[#212A3B]">{property.type}</td>
										<td className="py-4 px-4 text-[#212A3B]">{property.buildingType}</td>
										<td className="py-4 px-4 text-[#212A3B]">{property.dateCreated}</td>
										<td className="py-4 px-4">
											<button onClick={() => handlePropertySelect(property.id)}
												className="cursor-pointer text-[#306251] text-sm font-medium h-10 w-[6.938rem] bg-[#FFFFFF] border border-[#D0D5DD] hover:bg-[#E9EAEB] rounded-lg flex items-center justify-center">
												View Details
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
				{currentViewMode === "card" && (

					/* Card View */
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{properties.map((property) => (
							<div
								key={property.id}
								className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
								<h3 className="text-base font-medium text-[#212A3B] mb-4">{property.name}</h3>
								<div className="space-y-3 mb-6">
									<div className="flex justify-center gap-[0.563]">
										<span className="text-sm text-[#A4A8AF] font-normal w-full">Building Type</span>
										<span className="text-sm text-[#A4A8AF] font-normal w-full">Type</span>
									</div>
									<div className="flex justify-center gap-[0.563]">
										<span className="text-base font-normal text-[#474E5C] w-full">{property.type}</span>
										<span className="text-base font-normal text-[#474E5C] w-full">{property.buildingType}</span>
									</div>

									<div className="pt-2">
										<span className="text-sm text-[#A4A8AF] font-normal">Created on</span>
										<div className="text-sm font-normal text-[#474E5C]">{property.dateCreated}</div>
									</div>
								</div>

								<button
									onClick={() => handlePropertySelect(property.id)}
									className="cursor-pointer flex items-center justify-between w-full text-[#306251] text-sm font-medium"
								>
									<span>View Details</span>
									<ChevronRight className="w-4 h-4" />
								</button>
							</div>
						))}
					</div>
				)}
				{currentViewMode === "media" && (

					/* Card View */
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{properties.map((property) => (
							<PropertyCard
								key={property.id}
								title={property.name}
								buildingType={property.buildingType}
								type={property.type}
								createdOn={property.dateCreated}
								action={() => handlePropertySelect(property.id)}
								image="/placeholder.svg" // Placeholder image, replace with actual image if available
							/>
						))}
					</div>
				)}
			</div>

		</>
	)
}
