import type React from "react"
import { TrendingUp, Building, Star, FileText } from "lucide-react"
import Link from "next/link"

interface StatCard {
	title: string
	value: string
	subtitle?: string
	icon: React.ReactNode
	actionText: string
	actionHref: string
}

export function StatsCards() {
	const stats: StatCard[] = [
		{
			title: "Estimated Property Value",
			value: "₦201,000,000",
			icon: <TrendingUp className="w-[1.125rem] h-5 text-[#FFFFFF]" />,
			actionText: "See details",
			actionHref: "#",
		},
		{
			title: "Building Material Cost",
			value: "₦3,500",
			subtitle: "Cement /",
			icon: <Building className="w-[1.125rem] h-5 text-[#FFFFFF]" />,
			actionText: "See more",
			actionHref: "#",
		},
		{
			title: "Expert Review",
			value: "7",
			icon: <Star className="w-[1.125rem] h-5 text-[#FFFFFF]" />,
			actionText: "See details",
			actionHref: "#",
		},
		{
			title: "State Policy Updates",
			value: "4",
			icon: <FileText className="w-[1.125rem] h-5 text-[#FFFFFF]" />,
			actionText: "See details",
			actionHref: "#",
		},
	]

	return (
		<div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 status-cards">
			{stats.map((stat, index) => (
				<div className="flex flex-col" key={index}>
					<div key={index} className="bg-white h-[9.375rem] rounded-t-lg p-6  status-card-wrapper ">
						<div key={index} className="status-card"></div>
						<div className="flex items-center gap-3 mb-4">
							<div className="flex items-center justify-center bg-[#448C74] rounded-full w-8 h-8 md:w-12 md:h-12">{stat.icon}</div>
							<div className="flex-1">
								<p className="text-sm text-gray-600">{stat.title}</p>
							</div>
						</div>

						<div className="mb-4">
							<div className="flex items-baseline gap-1 justify-between">
								{stat.subtitle && <span className="text-lg font-normal text-[#212A3B]">{stat.subtitle}</span>}
								<span
									className="text-[1.313rem] font-medium text-gray-900 break-words max-w-full block truncate"
									style={{ wordBreak: "break-word" }}
									title={stat.value}
								>
									{stat.value}
								</span>
							</div>
						</div>

					</div>
					<Link
						href={stat.actionHref}
						className="text-[#306251] h-[2.5rem] bg-[#ECF4F1] text-sm rounded-b-lg font-medium flex items-center justify-center gap-2 p-2  "
					>
						{stat.actionText}
						<span>→</span>
					</Link>
				</div>
			))}
		</div>
	)
}
