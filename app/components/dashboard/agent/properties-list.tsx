"use client"

import { useState } from "react"
import {
	Search,
	SlidersHorizontal,

	ChevronLeft,
	ChevronRight,
} from "lucide-react"
import { Pagination } from "../../pagination"
import { useRouter } from "next/navigation"

interface PropertyListing {
	id: string
	addedBy: string
	title: string
	createdOn: string
}

interface DashboardProps {
	isMobile?: boolean
}

const propertyListings: PropertyListing[] = [
	{
		id: "1",
		addedBy: "Olumide Adeyemi",
		title: "Riverline Estate",
		createdOn: "Jul 21, 2023",
	},
	{
		id: "2",
		addedBy: "Olumide Adeyemi",
		title: "Riverline Estate",
		createdOn: "Jul 21, 2023",
	},
	{
		id: "3",
		addedBy: "Olumide Adeyemi",
		title: "Riverline Estate",
		createdOn: "Jul 21, 2023",
	},
	{
		id: "4",
		addedBy: "Olumide Adeyemi",
		title: "Riverline Estate",
		createdOn: "Jul 21, 2023",
	},
]

export default function PropertyListing({ isMobile = false }: DashboardProps) {
	const [currentPage, setCurrentPage] = useState(1)
	const [searchQuery, setSearchQuery] = useState("")
	const router = useRouter()

	const handleViewDetails = (id: string) => {
		router.push(`/agent/properties/listings/${id}/property-value`)
	}

	const itemsPerPage = 10


	const filteredProperties = propertyListings.filter((property) => property.title.toLowerCase().includes(searchQuery.toLowerCase()))

	const totalPages = Math.ceil(filteredProperties.length / itemsPerPage)
	const startIndex = (currentPage - 1) * itemsPerPage
	const paginatedProperties = filteredProperties.slice(startIndex, startIndex + itemsPerPage)

	const handlePageChange = (page: number) => {
		setCurrentPage(page)
	}


	// Desktop Layout
	return (
		<div className="min-h-screen  flex">

			{/* Main Content */}
			<div className="flex-1 flex flex-col">
				{/* Header */}

				{/* Dashboard Content */}
				<div className="flex-1 p-6">

					{/* Search and Filters */}
					<div className="md:hidden flex gap-3 mb-4">
						<div className="relative flex-1">
							<input
								type="text"
								placeholder="Search"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-10 pr-4 py-2 border border-[#E9EAEB] placeholder:text-[#A4A8AF] text-[#212A3B] rounded-full focus:outline-none"
							/>
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
						</div>

						<button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
							<SlidersHorizontal className="w-4 h-4 text-[#212A3B]" />
							<span className="text-sm text-[#212A3B]">Filters</span>
						</button>
					</div>

					{/* Assigned Listing Section */}
					<div className="bg-white rounded-lg shadow-sm">
						<div className="p-6 border-b border-gray-200">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<h3 className="text-base font-medium text-[#212A3B]">Assigned listing</h3>
									<span className="px-2 py-1 bg-[#E9EAEB] text-[#212A3B] w-6 h-6 text-xs font-medium rounded-2xl">4</span>
								</div>
								<div className="hidden md:flex items-center gap-4">
									<div className="relative">
										<input
											type="text"
											placeholder="Search"
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
											className="pl-10 pr-4 py-2 border border-[#E9EAEB] placeholder:text-[#A4A8AF] text-[#212A3B] rounded-full focus:outline-none"
										/>
										<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
									</div>
									<button className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors">
										<SlidersHorizontal className="w-4 h-4 text-[#212A3B]" />
										<span className="text-sm text-gray-700">Filters</span>
									</button>
								</div>
							</div>
						</div>

						{/* Table */}
						<div className="md:hidden bg-white rounded-lg shadow-sm">
							{/* Property List */}
							<div className="divide-y divide-gray-100">
								{paginatedProperties.map((property) => (
									<div key={property.id} className="p-4 flex flex-col gap-[0.625rem]">
										<div className="flex flex-col gap-2">
											<div className="flex justify-between items-start">
												<span className="text-sm text-[#7E838D]">Added by</span>
												<span className="text-sm text-[#474E5C]">{property.addedBy}</span>
											</div>
											<div className="flex justify-between items-start">
												<span className="text-sm text-[#7E838D]">Title</span>
												<span className="text-sm text-[#474E5C]">{property.title}</span>
											</div>
											<div className="flex justify-between items-start">
												<span className="text-sm text-[#7E838D]">Created on</span>
												<span className="text-sm text-[#474E5C]">{property.createdOn}</span>
											</div>
										</div>
										<button
											onClick={() => handleViewDetails(property.id)}
											className="w-full mt-3 text-center text-[#306251] text-sm font-medium py-2 rounded-lg cursor-pointer hover:borde transition-colors"
										>
											View Details
										</button>
									</div>
								))}
							</div>
						</div>
						<div className="hidden md:flex overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b border-gray-200">
										<th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Added by</th>
										<th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Title</th>
										<th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Created on</th>
										<th className="text-left py-4 px-6 text-sm font-medium text-gray-500"></th>
									</tr>
								</thead>
								<tbody>
									{paginatedProperties.map((property) => (
										<tr key={property.id} className="border-b border-gray-100 hover:bg-gray-50">
											<td className="py-4 px-6 text-sm text-gray-900">{property.addedBy}</td>
											<td className="py-4 px-6 text-sm text-gray-900">{property.title}</td>
											<td className="py-4 px-6 text-sm text-gray-900">{property.createdOn}</td>
											<td className="py-4 px-6">
												<button
													onClick={() => handleViewDetails(property.id)}
													className="text-sm text-[#448C74] py-[0.625rem] px-4 rounded-lg border border-[#D0D5DD] hover:text-[#357a63] font-normal cursor-pointer"
												>
													View Details
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>



						<Pagination currentPage={currentPage} totalPages={totalPages} handlePageChange={handlePageChange} />
					</div>
				</div>
			</div>
		</div>
	)
}
