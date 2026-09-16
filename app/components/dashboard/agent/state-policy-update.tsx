"use client"

import { useState } from "react"
import { Pen, SlidersHorizontal, Trash2 } from "lucide-react"
import { OverViewBreadCrumbs } from "./breadcrumb"
import OverviewTab from "./overviewTap"
import AddReviewModal from "../admin/add-review"
import { useParams } from "next/navigation"

interface StatePolicyUpdate {
	id: string
	timestamp: string
	content: string
	done: boolean
}

 

const statePolicyUpdates: StatePolicyUpdate[] = [
	{
		id: "1",
		timestamp: "Feb 5, 2024 09:15AM",
		content: `The recent policy introduced by the Lagos State Government, which limits property ownership to a maximum of 100 years before reverting to state control, raises significant concerns. This approach could impact long-term investments and property rights. Stakeholders should closely examine the implications of this policy. For further details, refer to the official website at http://lagsgov.com/landuse/new.`,
		done: true,
	},
	{
		id: "2",
		timestamp: "Feb 5, 2024 09:15AM",
		content: `The Lagos State Government has proposed that the every property can not be owned beyond 100years. After which it is the property of state. Details available at the url http://lagsgov.com/landuse/new`,
		done: false,
	},
	{
		id: "3",
		timestamp: "Feb 5, 2024 09:15AM",
		content: `The Lagos State Government has proposed that the every property can not be owned beyond 100years. After which it is the property of state. Details available at the url http://lagsgov.com/landuse/new`,
		done: false,
	},
	{
		id: "4",
		timestamp: "Feb 5, 2024 09:15AM",
		content: `The Lagos State Government has proposed that the every property can not be owned beyond 100years. After which it is the property of state. Details available at the url http://lagsgov.com/landuse/new`,
		done: false,
	},
]

export default function StatePolicyUpdate() {
	const [showFilters, setShowFilters] = useState(false)
	const [openEditModal, setOpenEditModal] = useState<boolean>(false)
const {id:pageId} = useParams<{id: string}>()
	const handleFiltersClick = () => {
		setShowFilters(!showFilters)
	}

  const handleEdit = (id: string) => {
    setOpenEditModal(true)
  }
		
  const handleDelete = (id: string) => {
console.log(id)
  };
	return (
		<>
			<div className="md:hidden min-h-screen  flex flex-col gap-6">
				<OverViewBreadCrumbs property={"GreenLand Estate"} page={"State Policy Updates"} />
				<div className="flex flex-col gap-4">
					{/* Property Title */}
					<OverviewTab />
					<h1 className="text-base font-medium text-[#212A3B]">GreenLand Estate</h1>
					{/* Review Section */}
					<div className="bg-white rounded-lg shadow-sm p-4">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-base font-medium text-[#212A3B]">State Policy Updates</h2>
							<button
								onClick={handleFiltersClick}
								className="flex items-center gap-2 px-4 py-2"
							>
								<SlidersHorizontal className="w-4 h-4 text-[#212A3B]" />
								<span className="text-sm text-[#212A3B]">Filters</span>
							</button>
						</div>

						{/* Reviews Timeline */}
						<div className="relative space-y-6">
							<div className="absolute right-0 flex items-center gap-3">
								<button className="cursor-pointer" type="button" aria-label="Edit"
								onClick={() => handleEdit(pageId)}
								>
									<Pen className="w-5 h-5 text-[#448C74]" />
								</button>
								<button className="cursor-pointer"
									onClick={() => handleDelete(pageId)} 
									type="button" aria-label="Delete">
									<Trash2 className="w-5 h-5 text-[#448C74]" />
								</button>
							</div>
							{statePolicyUpdates.map((update) => (
								<div key={update.id} className="flex gap-4">
									{/* Timeline Dot */}
									<div className="flex flex-col items-center">
										<div className={`w-4 h-4 border-4 ${update.done ? "bg-[#448C74] border-[#ECF4F1]" : " bg-[#A4A8AF] border-[#FFFFFF]"} rounded-full flex-shrink-0 mt-1`} />
										{update.id !== statePolicyUpdates[statePolicyUpdates.length - 1].id && (
											<div className="w-px bg-gray-200 flex-1 mt-2" style={{ minHeight: "60px" }} />
										)}
									</div>

									{/* Review Content */}
									<div className="flex-1 pb-6">
										<p className="text-sm text-gray-500 mb-2">{update.timestamp}</p>
										<p className="text-sm text-gray-700 leading-relaxed">{update.content}</p>
									</div>
								</div>
							))}
							
						</div>
					</div>
				</div>
				<AddReviewModal isOpen={openEditModal} onClose={() => setOpenEditModal(false)} />
			</div>

			<div className="min-h-screen  md:flex hidden flex-col gap-6">
				<OverViewBreadCrumbs property={"GreenLand Estate"} page={"State Policy Updates"} />

				<div className="flex flex-col gap-4">
					{/* Property Title */}

					<h1 className="text-[1.313rem] font-medium text-[#212A3B]">GreenLand Estate</h1>
					<OverviewTab />
					{/* State Policy Updates Section */}
					<div className="bg-white rounded-lg shadow-sm p-6">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-base font-medium text-[#212A3B]">State Policy Updates</h2>
							<button
								onClick={handleFiltersClick}
								className="flex items-center gap-2 px-4 py-2"
							>
								<SlidersHorizontal className="w-4 h-4 text-[#212A3B]" />
								<span className="text-sm text-[#212A3B]">Filters</span>
							</button>
						</div>

						{/* Reviews Timeline */}
						<div className="space-y-8 relative">
							<div className="absolute right-0 flex items-center gap-3">
								<button className="cursor-pointer" type="button" aria-label="Edit"
								onClick={() => handleEdit(pageId)}
								>
									<Pen className="w-5 h-5 text-[#448C74]" />
								</button>
								<button className="cursor-pointer"
									onClick={() => handleDelete(pageId)} 
									type="button" aria-label="Delete">
									<Trash2 className="w-5 h-5 text-[#448C74]" />
								</button>
							</div>
							{statePolicyUpdates.map((update) => (
								<div key={update.id} className="flex gap-4">
									{/* Timeline Dot */}
									<div className="flex flex-col items-center">
										<div className={`w-4 h-4 border-4 ${update.done ? "bg-[#448C74] border-[#ECF4F1]" : " bg-[#A4A8AF] border-[#FFFFFF]"} rounded-full flex-shrink-0 mt-1`} />
										{update.id !== statePolicyUpdates[statePolicyUpdates.length - 1].id && (
											<div className="w-px bg-gray-200 flex-1 mt-2" style={{ minHeight: "80px" }} />
										)}
									</div>

									{/* Review Content */}
									<div className="flex-1 pb-6">
										<p className="text-sm text-gray-500 mb-3">{update.timestamp}</p>
										<p className="text-gray-700 leading-relaxed">{update.content}</p>
									</div>
								</div>
							))}

						</div>
					</div>
				</div>
				<AddReviewModal isOpen={openEditModal} onClose={() => setOpenEditModal(false)} />
			</div>
		</>

	)
}
