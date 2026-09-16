"use client"

import type React from "react"

import { useState } from "react"
import { X, Filter, Minimize2 } from "lucide-react"

interface ReviewItem {
	id: string
	date: string
	content: string
	link?: string
}

interface ReviewModalProps {
	isOpen: boolean
	onClose: () => void
}

export function ReviewModal({ isOpen, onClose }: ReviewModalProps) {
	const [activeTab, setActiveTab] = useState("State Policy Updates")

	const reviewItems: ReviewItem[] = [
		{
			id: "1",
			date: "Feb 5, 2024 09:15AM",
			content:
				"The recent policy introduced by the Lagos State Government, which limits property ownership to a maximum of 100 years before reverting to state control, raises significant concerns. This approach could impact long-term investments and property rights. Stakeholders should closely examine the implications of this policy. For further details, refer to the official website at http://lagsgov.com/landuse/new.",
		},
		{
			id: "2",
			date: "Feb 5, 2024 09:15AM",
			content:
				"The Lagos State Government has proposed that the every property can not be owned beyond 100years. After which it is the property of state.",
			link: "http://lagsgov.com/landuse/new",
		},
		{
			id: "3",
			date: "Feb 5, 2024 09:15AM",
			content:
				"The Lagos State Government has proposed that the every property can not be owned beyond 100years. After which it is the property of state.",
			link: "http://lagsgov.com/landuse/new",
		},
		{
			id: "4",
			date: "Feb 5, 2024 09:15AM",
			content:
				"The Lagos State Government has proposed that the every property can not be owned beyond 100years. After which it is the property of state.",
			link: "http://lagsgov.com/landuse/new",
		},
		{
			id: "5",
			date: "Feb 5, 2024 09:15AM",
			content:
				"Lorem ipsum dolor sit amet consectetur. Volutpat quisque ornare euismod libero. Sapien suspendisse auctor nunc vulputate tempus ipsum. Erat proin tellus purus euismod pharetra quisque pretium sit.",
		},
		{
			id: "6",
			date: "Feb 5, 2024 09:15AM",
			content:
				"Lorem ipsum dolor sit amet consectetur. Volutpat quisque ornare euismod libero. Sapien suspendisse auctor nunc vulputate tempus ipsum. Erat proin tellus purus euismod pharetra quisque pretium sit.",
		},
		{
			id: "7",
			date: "Feb 5, 2024 09:15AM",
			content:
				"Lorem ipsum dolor sit amet consectetur. Volutpat quisque ornare euismod libero. Sapien suspendisse auctor nunc vulputate tempus ipsum. Erat proin tellus purus euismod pharetra quisque pretium sit.",
		},
	]

	if (!isOpen) return null

	const handleBackdropClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) {
			onClose()
		}
	}

	const handleTabClick = (tab: string) => {
		setActiveTab(tab)
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleBackdropClick}>
			{/* Backdrop */}
			<div className="fixed inset-0 bg-black/20 backdrop-blur-sm" />

			{/* Modal */}
			<div className="relative ml-auto md:mr-[1.188rem] w-full h-full max-h-[41.813rem] min-w-[21.438rem] md:max-w-[33.75rem] md:h-[90%] md:max-h-[800px] bg-[#FFFFFF] rounded-2xl shadow-xl">
				{/* Close Button */}
				<button
					onClick={onClose}
					className="fixed z-[60] md:left-auto right-4 md:-translate-x-[130%] md:top-12 top-12 p-2 text-[#000000] border border-[#D0D5DD] :bg-gray-100 rounded-lg bg-white shadow"
					style={{
						// Place to the left of the modal box on desktop, top left on mobile
						// No pointer events blocking from backdrop
						pointerEvents: "auto"
					}}
				>
					<X className="w-5 h-5" />
				</button>
				{/* Header */}
				<div className="flex items-center justify-between p-4 md:p-6">
					<div className="flex items-center gap-4">

						<h3 className="text-base font-medium text-[#212A3B]">Review</h3>
					</div>

					<div className="flex items-center gap-2">
						<button className="flex items-center gap-2 px-3 py-2 font-normal text-sm text-[#212A3B] cursor-pointer">
							<Filter className="w-4 h-4" />
							Filters
						</button>
						<button className="flex items-center gap-2 px-3 py-2 font-normal text-sm text-[#212A3B] cursor-pointer"
							onClick={onClose}
						>
							<Minimize2 className="w-4 h-4" />
							Show less
						</button>
					</div>
				</div>

				{/* Tabs */}
				<div className="flex px-6 w-full justify-center items-center">
					<div className="flex w-full gap-4 mb-6 bg-[#F4F6F8] p-1	rounded-lg min-h-[2.75rem]">
						<button
							className={`py-2 px-4 border-[1px] border-[#ECF4F1] rounded-lg min-[2.125rem] w-full cursor-pointer ${activeTab === "Expert Review" ? "bg-[#FFFFFF] text-[#306251]" : " text-[#A4A8AF]"}`}
							onClick={() => setActiveTab("Expert Review")}
						>
							Expert Review
						</button>
						<button
							className={`py-2 px-4 border-[1px] border-[#ECF4F1] rounded-lg min-[2.125rem] w-full cursor-pointer ${activeTab === "State Policy Updates" ? "bg-[#FFFFFF] text-[#306251]" : "text-[#A4A8AF]"}`}
							onClick={() => setActiveTab("State Policy Updates")}
						>
							State Policy Updates
						</button>
					</div>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-auto p-4 md:px-6 h-[calc(100%-12rem)] md:h-[calc(100% - 6rem)]">
					<div className="space-y-6">
						{reviewItems.map((item) => (
							<div key={item.id} className="flex gap-4">
								<div className="flex flex-col items-center mr-4">
									<div className="min-w-4 min-h-4 bg-[#448C74] rounded-full mt-1 flex-shrink-0 shadow-lg border-4 border-[#ECF4F1]" />
									{/* Vertical line: only show if not last item */}
									{item.id !== reviewItems[reviewItems.length - 1].id && (
										<div className="w-0.5 flex-1 mt-6 bg-[#E9EAEB] my-1" />
									)}
								</div>
								<div className="flex-1">
									<p className="text-sm text-gray-500 mb-2">{item.date}</p>
									<p className="text-gray-700 leading-relaxed mb-2">{item.content}</p>
									{item.link && (
										<a
											href={item.link}
											className="text-green-600 hover:text-green-700 text-sm underline"
											target="_blank"
											rel="noopener noreferrer"
										>
											Details available at the url {item.link}
										</a>
									)}
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}
