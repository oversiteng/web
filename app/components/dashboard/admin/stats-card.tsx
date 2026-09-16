import type React from "react"
import { TrendingUp, Building, Star, FileText } from "lucide-react"
import { MetricCard } from "./metric-card"

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
			title: "Property Listing",
			value: "31",
			icon: <TrendingUp className="w-[1.125rem] h-5 text-[#FFFFFF]" />,
			actionText: "See details",
			actionHref: "#",
		},
		{
			title: "Reports added this week",
			value: "31",
			icon: <Building className="w-[1.125rem] h-5 text-[#FFFFFF]" />,
			actionText: "See more",
			actionHref: "#",
		}
	]
	const handleSeeDetails = (type: string) => {
		console.log(`See details clicked for: ${type}`)
		// Navigate to respective detail pages
	}
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 status-cards">
			<div className="md:col-span-2 lg:col-span-1">
				<MetricCard title="Total Property Listings" value="345" className="h-full bg-[#ECF4F1]! gap-6" />
			</div>
			<MetricCard
				title="Property Listing"
				value="3"
				hasDetails={true}
				hasDropdown={true}
				dropdownValue="This Week"
				onDetailsClick={() => handleSeeDetails("property-listing")}
			/>
			<MetricCard
				title="Recurring subscriber"
				value="3"
				hasDetails={true}
				hasDropdown={true}
				dropdownValue="January"

				onDetailsClick={() => handleSeeDetails("recurring-subscriber")}
			/>
		</div>
	)
}


<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
	{/* Total Property Listings */}


	{/* Property Listing */}


	{/* Recurring Subscriber */}

</div>
