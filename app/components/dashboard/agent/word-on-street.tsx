"use client"

import { useState } from "react"
import { Pen, SlidersHorizontal, Trash2 } from "lucide-react"
import { OverViewBreadCrumbs } from "./breadcrumb"
import OverviewTab from "./overviewTap"
import { useParams } from "next/navigation"
import AddReviewModal from "../admin/add-review"

interface WordOnTheStreet {
	id: string
	timestamp: string
	content: string
	done: boolean
}

interface WordOnTheStreetProps {
	isMobile?: boolean
}

const Words: WordOnTheStreet[] = [
	{
		id: "1",
		timestamp: "Feb 5, 2024 09:15AM",
		content: `The recent policy introduced by the Lagos State Government, which limits property ownership to a maximum of 100 years before reverting to state control, raises significant concerns. This approach could impact long-term investments and property rights. Stakeholders should closely examine the implications of this policy. For further details, refer to the official website at http://lagsgov.com/landuse/new.`,
		done: true
	},
	{
		id: "2",
		timestamp: "Feb 5, 2024 09:15AM",
		content: `The Lagos State Government has proposed that the every property can not be owned beyond 100years. After which it is the property of state. Details available at the url http://lagsgov.com/landuse/new`,
		done: false
	},
	{
		id: "3",
		timestamp: "Feb 5, 2024 09:15AM",
		content: `The Lagos State Government has proposed that the every property can not be owned beyond 100years. After which it is the property of state. Details available at the url http://lagsgov.com/landuse/new`,
		done: false
	},
	{
		id: "4",
		timestamp: "Feb 5, 2024 09:15AM",
		content: `The Lagos State Government has proposed that the every property can not be owned beyond 100years. After which it is the property of state. Details available at the url http://lagsgov.com/landuse/new`,
		done: false
	},
]

export default function WordOnStreet({ isMobile = false }: WordOnTheStreetProps) {
	const [showFilters, setShowFilters] = useState(false)
	const [openEditModal, setOpenEditModal] = useState<boolean>(false)
	const { id: pageId } = useParams<{ id: string }>()
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
				<OverViewBreadCrumbs property={"GreenLand Estate"} page={"Word on the Street"} />

				<div className="flex flex-col gap-4">
					{/* Property Title */}
					<OverviewTab />
					<h1 className="text-[1.313rem] font-medium text-[#212A3B]">GreenLand Estate</h1>

					{/* Review Section */}
					<div className="bg-white rounded-lg shadow-sm p-4">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-base font-medium text-[#212A3B]">Word on the Street</h2>
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
							{Words.map((word) => (
								<div key={word.id} className="flex gap-4">
									{/* Timeline Dot */}
									<div className="flex flex-col items-center">
										<div className={`w-4 h-4 border-4 ${word.done ? "bg-[#448C74] border-[#ECF4F1]" : " bg-[#A4A8AF] border-[#FFFFFF]"} rounded-full flex-shrink-0 mt-1`} />
										{word.id !== Words[Words.length - 1].id && (
											<div className="w-px bg-gray-200 flex-1 mt-2" style={{ minHeight: "60px" }} />
										)}
									</div>

									{/* Review Content */}
									<div className="flex-1 pb-6">
										<p className="text-sm text-gray-500 mb-2">{word.timestamp}</p>
										<p className="text-sm text-[#212A3B] leading-relaxed">{word.content}</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
				<AddReviewModal isOpen={openEditModal} onClose={() => setOpenEditModal(false)} />
			</div>

			<div className="min-h-screen  hidden md:flex flex-col gap-6">
				<OverViewBreadCrumbs property={"GreenLand Estate"} page={"Word on the Street"} />

				<div className="flex flex-col gap-4">
					{/* Property Title */}
					<h1 className="text-[1.313rem] font-medium text-[#212A3B]">GreenLand Estate</h1>
					<OverviewTab />
					{/* Word on the Street Section */}
					<div className="bg-white rounded-lg shadow-sm p-6">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-base font-medium text-[#212A3B]">Word on the Street</h2>
							<button
								onClick={handleFiltersClick}
								className="flex items-center gap-2 px-4 py-2"
							>
								<SlidersHorizontal className="w-4 h-4 text-[#212A3B]" />
								<span className="text-sm text-[#212A3B]">Filters</span>
							</button>
						</div>

						{/* Reviews Timeline */}
						<div className="relative space-y-8">
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
							{Words.map((word) => (
								<div key={word.id} className="flex gap-4">
									{/* Timeline Dot */}
									<div className="flex flex-col items-center">
										<div className={`w-4 h-4 border-4 ${word.done ? "bg-[#448C74] border-[#ECF4F1]" : " bg-[#A4A8AF] border-[#FFFFFF]"} rounded-full flex-shrink-0 mt-1`} />
										{word.id !== Words[Words.length - 1].id && (
											<div className="w-px bg-gray-200 flex-1 mt-2" style={{ minHeight: "80px" }} />
										)}
									</div>

									{/* Review Content */}
									<div className="flex-1 pb-6">
										<p className="text-sm text-gray-500 mb-3">{word.timestamp}</p>
										<p className="text-[#212A3B] leading-relaxed">{word.content}</p>
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
