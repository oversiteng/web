"use client"

import { useState } from "react"
import { Search, Filter } from "lucide-react"
import { Property } from "@/libs/interface"
import { Sidebar } from "@/app/components/dashboard/admin/sidebar"
import { Header } from "@/app/components/dashboard/header"
import { useLayoutContext } from "@/app/ProviderLayout"
import { Pagination } from "@/app/components/pagination"
import { useRouter } from "next/navigation"

const mockProperties: Property[] = [
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
	{
		id: "7",
		name: "Countryside Cottage",
		type: "Building",
		buildingType: "Bungalow",
		dateCreated: "Oct 22, 2023",
		status: "assigned",
	},
	{
		id: "8",
		name: "Countryside Cottage",
		type: "Building",
		buildingType: "Bungalow",
		dateCreated: "Oct 22, 2023",
		status: "assigned",
	},
	{
		id: "9",
		name: "Countryside Cottage",
		type: "Building",
		buildingType: "Bungalow",
		dateCreated: "Oct 22, 2023",
		status: "assigned",
	},
	{
		id: "10",
		name: "Countryside Cottage",
		type: "Building",
		buildingType: "Bungalow",
		dateCreated: "Oct 22, 2023",
		status: "assigned",
	},
	{
		id: "11",
		name: "Countryside Cottage",
		type: "Building",
		buildingType: "Bungalow",
		dateCreated: "Oct 22, 2023",
		status: "assigned",
	},
	{
		id: "12",
		name: "Countryside Cottage",
		type: "Building",
		buildingType: "Bungalow",
		dateCreated: "Oct 22, 2023",
		status: "assigned",
	},
	{
		id: "13",
		name: "Countryside Cottage",
		type: "Building",
		buildingType: "Bungalow",
		dateCreated: "Oct 22, 2023",
		status: "assigned",
	},
	{
		id: "14",
		name: "Countryside Cottage",
		type: "Building",
		buildingType: "Bungalow",
		dateCreated: "Oct 22, 2023",
		status: "assigned",
	},
	{
		id: "15",
		name: "Countryside Cottage",
		type: "Building",
		buildingType: "Bungalow",
		dateCreated: "Oct 22, 2023",
		status: "assigned",
	},

	{
		id: "16",
		name: "Banana Villa",
		type: "Land",
		buildingType: "Duplex",
		dateCreated: "Jul 21, 2023",
		status: "pending",
	},
	{
		id: "17",
		name: "Sunset Paradise",
		type: "Waterfront",
		buildingType: "Villa",
		dateCreated: "Aug 15, 2023",
		status: "pending",
	},
	{
		id: "18",
		name: "Mountain Retreat",
		type: "Highland",
		buildingType: "Cottage",
		dateCreated: "Sep 10, 2023",
		status: "pending",
	},
	{
		id: "19",
		name: "Urban Oasis",
		type: "City Center",
		buildingType: "Apartment",
		dateCreated: "Oct 5, 2023",
		status: "pending",
	},
	{
		id: "20",
		name: "Seaside Escape",
		type: "Coastal",
		buildingType: "Bungalow",
		dateCreated: "Jul 30, 2023",
		status: "pending",
	},
]

export default function PropertiesListingsPage() {
	const router = useRouter()
	const { user } = useLayoutContext()
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
	const [activeTab, setActiveTab] = useState("assigned")
	const [searchTerm, setSearchTerm] = useState("")
	const [currentPage, setCurrentPage] = useState(1)
	const itemsPerPage = 10

	const assignedProperties = mockProperties.filter((p) => p.status === "assigned")
	const pendingProperties = mockProperties.filter((p) => p.status === "pending")

	const currentProperties = activeTab === "assigned" ? assignedProperties : pendingProperties
	const filteredProperties = currentProperties.filter(
		(property) =>
			property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			property.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
			property.buildingType.toLowerCase().includes(searchTerm.toLowerCase()),
	)

	const totalPages = Math.ceil(filteredProperties.length / itemsPerPage)
	const startIndex = (currentPage - 1) * itemsPerPage
	const paginatedProperties = filteredProperties.slice(startIndex, startIndex + itemsPerPage)

	const handlePageChange = (page: number) => {
		setCurrentPage(page)
	}

	const handlePropertySelect = (propertyId: string) => {
		router.push(`value/${propertyId}`)
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
					<div className="flex items-center gap-3 md:hidden w-full mb-[0.938rem]">
						<div className="relative w-full">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
							<input
								type="text"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								placeholder="Search"
								className="pl-10 pr-4 py-2 bg-[#F6F9FC] border border-[#E9EAEB] rounded-[3.625rem] outline-none w-full"
							/>
						</div>
						<button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50">
							<Filter className="w-4 h-4" />
							<span>Filters</span>
						</button>
					</div>
					<div className="bg-white rounded-lg shadow-sm border">
						<div className="p-6 border-b">
							<div className="flex flex-row justify-between gap-4">
								<div className="flex items-center gap-8">
									<button
										onClick={() => {
											setActiveTab("assigned")
											setCurrentPage(1)
										}}
										className={`flex items-center gap-2 pb-2 border-b-2 transition-colors ${activeTab === "assigned"
											? "border-green-600 text-green-600"
											: "border-transparent text-[#7E838D] hover:text-gray-700"
											}`}
									>
										<span className="font-medium">Assigned Listing</span>
										<span className="bg-gray-100 text-[#474E5C] text-sm px-2 py-0.5 rounded-full text-sm">
											{assignedProperties.length}
										</span>
									</button>
									<button
										onClick={() => {
											setActiveTab("pending")
											setCurrentPage(1)
										}}
										className={`flex items-center gap-2 pb-2 border-b-2 transition-colors ${activeTab === "pending"
											? "border-green-600 text-green-600"
											: "border-transparent text-[#7E838D] hover:text-gray-700"
											}`}
									>
										<span className="font-medium">Pending Listing</span>
										<span className="bg-gray-100 text-[#474E5C] text-sm px-2 py-0.5 rounded-full text-sm">
											{pendingProperties.length}
										</span>
									</button>
								</div>

								<div className="md:flex items-center gap-3 hidden">
									<div className="relative">
										<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
										<input
											type="text"
											value={searchTerm}
											onChange={(e) => setSearchTerm(e.target.value)}
											placeholder="Search"
											className="pl-10 pr-4 py-2 bg-[#F6F9FC] border border-[#E9EAEB] rounded-[3.625rem] outline-none w-64"
										/>
									</div>
									<button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50">
										<Filter className="w-4 h-4" />
										<span>Filters</span>
									</button>
								</div>
							</div>
						</div>

						{/* Desktop Table View */}
						<div className="hidden md:block overflow-x-auto">
							<table className="w-full min-w-6xl">
								<thead className="bg-gray-50">
									<tr>
										<th className="text-left py-3 px-6 font-medium text-gray-700">Name</th>
										<th className="text-left py-3 px-6 font-medium text-gray-700">Type</th>
										<th className="text-left py-3 px-6 font-medium text-gray-700">Building Type</th>
										<th className="text-left py-3 px-6 font-medium text-gray-700">Created on</th>
										<th className="text-left py-3 px-6 font-medium text-gray-700"></th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-100">
									{paginatedProperties.map((property) => (
										<tr key={property.id} className="hover:bg-gray-50">
											<td className="py-4 px-6 text-gray-900">{property.name}</td>
											<td className="py-4 px-6 text-[#474E5C]">{property.type}</td>
											<td className="py-4 px-6 text-[#474E5C]">{property.buildingType}</td>
											<td className="py-4 px-6 text-[#474E5C]">{property.dateCreated}</td>
											<td className="py-4 px-6">
												<button className="cursor-pointer text-[#306251] 
											 h-10 w-[6.938rem] font-normal bg-[#FFFFFF] 
												border border-[#D0D5DD] hover:bg-[#E9EAEB] rounded-lg 
												flex items-center justify-center"
													onClick={() => handlePropertySelect(property.id)}>
													View Details
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{/* Mobile Card View */}
						<div className="md:hidden divide-y divide-gray-100">
							{paginatedProperties.map((property) => (
								<div key={property.id} className="p-6">
									<div className="space-y-3">
										<div className="flex justify-between items-start">
											<span className="text-sm text-[#7E838D]">Name</span>
											<span className="text-gray-900 font-medium">{property.name}</span>
										</div>
										<div className="flex justify-between items-start">
											<span className="text-sm text-[#7E838D]">Type</span>
											<span className="text-[#474E5C] text-sm">{property.type}</span>
										</div>
										<div className="flex justify-between items-start">
											<span className="text-sm text-[#7E838D]">Building Type</span>
											<span className="text-[#474E5C] text-sm">{property.buildingType}</span>
										</div>
										<div className="pt-3 flex align-center justify-center">
											{/* <button onClick={() => handlePropertySelect(property.id)} */}
											<button className="cursor-pointer text-[#306251] text-sm font-medium h-10 w-[6.938rem] bg-[#FFFFFF] hover:bg-[#E9EAEB] rounded-lg">
												View Details
											</button>
										</div>
									</div>
								</div>
							))}
						</div>

						<Pagination currentPage={currentPage} totalPages={totalPages} handlePageChange={handlePageChange} />
					</div>
				</main>
			</div>
		</div>
	)
}
