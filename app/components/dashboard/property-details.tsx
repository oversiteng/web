"use client"

import {
	Edit,
	FileText,
	TrendingUp,
	Building,
	MapPin,
	Star,
	Shield,
	MessageSquare,
	Users,
	Megaphone,
	Eye,
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { BackNavButton } from "../backNavButton"

interface PropertyDetailsProps {
	propertyName?: string
}

export function PropertyDetails({ propertyName = "GreenLand Estate" }: PropertyDetailsProps) {
	const router = useRouter()
	const { id: property_id } = useParams<{ id: string }>()

	const pathname = typeof window !== "undefined" ? window.location.pathname.split("/").filter(Boolean).pop() || "" : ""

	const propertyStats = [
		{
			id: `/user/properties/property-value/${property_id}`,
			title: "Estimated Property Value",
			value: "₦201,000,000",
			icon: <TrendingUp className="w-6 h-6" />,
			actionText: "See details",
			bgColor: "bg-green-100",
			iconColor: "text-green-600",
		},
		{
			id: `/user/properties/material-cost/${property_id}`,
			title: "Building Material Cost",
			value: "₦3,500",
			subtitle: "Cement /",
			icon: <Building className="w-6 h-6" />,
			actionText: "See more",
			bgColor: "bg-green-100",
			iconColor: "text-green-600",
		},
		{
			id: `/user/properties/landmarks/${property_id}`,
			title: "Landmarks",
			value: "5",
			icon: <MapPin className="w-6 h-6" />,
			actionText: "See more",
			bgColor: "bg-green-100",
			iconColor: "text-green-600",
		},
		{
			id: `/user/properties/timeline/${property_id}/expert-review/`,
			title: "Expert Review",
			value: "7",
			icon: <Star className="w-6 h-6" />,
			actionText: "See details",
			bgColor: "bg-green-100",
			iconColor: "text-green-600",
		},
		{
			id: `/user/properties/timeline/${property_id}/policy-updates`,
			title: "State Policy Updates",
			value: "4",
			icon: <Shield className="w-6 h-6" />,
			actionText: "See details",
			bgColor: "bg-green-100",
			iconColor: "text-green-600",
		},
		{
			id: `/user/properties/timeline/${property_id}/community-update`,
			title: "Community Update",
			value: "5",
			icon: <MessageSquare className="w-6 h-6" />,
			actionText: "See more",
			bgColor: "bg-green-100",
			iconColor: "text-green-600",
		},
		{
			id: `/user/properties/timeline/${property_id}/word-on-street`,
			title: "Word on the Street",
			value: "8",
			icon: <Megaphone className="w-6 h-6" />,
			actionText: "See more",
			bgColor: "bg-green-100",
			iconColor: "text-green-600",
		},
		{
			id: `/user/properties/vulnerability-test/${property_id}`,
			title: "Request Vulnerability Test",
			value: "2",
			icon: <Users className="w-6 h-6" />,
			actionText: "See more",
			bgColor: "bg-green-100",
			iconColor: "text-green-600",
		},
	]

	const handleCardAction = (cardId: string) => {
		router.push(`/user/properties/${cardId}/${property_id}`)
	}

	return (
		<div className="space-y-8">
			<div className="flex flex-col md:flex-row md:items-center justify-between">
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
			</div>
			<div className="flex flex-col md:flex-row md:items-center justify-between">
				<h1 className="text-[1.125rem] md:text-[1.313rem] font-medium text-[#212A3B]">{propertyName}</h1>

				<div className="flex flex-col sm:flex-row gap-3">
					<button className="flex items-center justify-center gap-2 px-4 py-2 border border-[#B2D0C6] bg-[#ECF4F1] rounded-lg text-sm font-medium text-[#306251] hover:bg-gray-50 transition-colors  cursor-pointer">
						<Edit className="w-4 h-4 text-[#306251]" />
						<span>Edit property</span>
					</button>
					<button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#448C74] text-white text-sm font-medium rounded-lg transition-colors cursor-pointer" onClick={() => handleCardAction("property-value")} >
						<Eye className="w-4 h-4" />
						<span>View Details</span>
					</button>
					<button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#448C74] text-white text-sm font-medium rounded-lg transition-colors  cursor-pointer" onClick={() => handleCardAction("report")}>
						<FileText className="w-4 h-4" />
						<span>View Reports</span>
					</button>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6  property-status-cards">
				{propertyStats.map((stat, index) => (
					<div className="flex flex-col" key={index}>
						<div key={index} className="bg-white h-[9.375rem] rounded-t-lg p-6 status-card-wrapper ">
							<div key={index} className="status-card"></div>
							<div className="flex items-center gap-3 mb-4">
								<div className="flex items-center justify-center bg-[#448C74] text-white rounded-full w-8 h-8 md:w-12 md:h-12">{stat.icon}</div>
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
							href={stat.id}
							className="text-[#306251] h-[2.5rem] rounded-b-lg bg-[#ECF4F1] text-sm font-medium flex items-center justify-center gap-2 p-2">
							{stat.actionText}
							<span>→</span>
						</Link>
					</div>
				))}
			</div>
		</div>
	)
}
