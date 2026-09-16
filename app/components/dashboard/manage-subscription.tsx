"use client"

import { useState } from "react"
import { Check, MoreHorizontal, X } from "lucide-react"

interface SubscriptionPlan {
	id: string
	name: string
	price: number
	currency: string
	period: string
	features: string[]
	isActive: boolean
	isPopular?: boolean
}

interface BillingRecord {
	id: string
	invoiceId: string
	plan: string
	amount: number
	currency: string
	dateCreated: string
	status: "paid" | "failed"
}
interface SubscriptionProps {
	isMobile?: boolean
}
const subscriptionPlans: SubscriptionPlan[] = [
	{
		id: "basic",
		name: "Basic",
		price: 0,
		currency: "₦",
		period: "month",
		features: ["1 Property listing", "Bi-Monthly Reports", "0 Vulnerability Tests"],
		isActive: true,
	},
	{
		id: "premium",
		name: "Premium",
		price: 5000,
		currency: "₦",
		period: "month",
		features: ["3 Property listing", "Bi-Monthly Reports", "0 Vulnerability Tests"],
		isActive: false,
	},
	{
		id: "standard",
		name: "Standard",
		price: 10000,
		currency: "₦",
		period: "month",
		features: ["10 Property listing", "Bi-Monthly Reports", "0 Vulnerability Tests"],
		isActive: false,
	},
]

const billingHistory: BillingRecord[] = [
	{
		id: "1",
		invoiceId: "Invoice-Jan001",
		plan: "Premium",
		amount: 5000,
		currency: "₦",
		dateCreated: "Apr 21, 2024",
		status: "paid",
	},
	{
		id: "2",
		invoiceId: "Invoice-Jan001",
		plan: "Standard",
		amount: 10000,
		currency: "₦",
		dateCreated: "Apr 21, 2024",
		status: "failed",
	},
	{
		id: "3",
		invoiceId: "Invoice-Jan001",
		plan: "Premium",
		amount: 5000,
		currency: "₦",
		dateCreated: "Apr 21, 2024",
		status: "paid",
	},
]

export default function SubscriptionPage({ isMobile = false }: SubscriptionProps) {
	const [selectedPlan, setSelectedPlan] = useState("basic")

	const handleUpgrade = (planId: string) => {
		console.log(`Upgrading to ${planId}`)
		// Handle upgrade logic here
	}

	const formatPrice = (price: number, currency: string) => {
		if (price === 0) return `${currency}0`
		return `${currency}${price.toLocaleString()}`
	}

	return (
		<div className="min-h-screen">
			<div className="max-w-7xl mx-auto">
				{/* Subscription Plans Section */}
				<div className="mb-8 min-h-[21.75rem] min-w-[22.458rem]">
					<div className="flex overflow-x-auto md:grid md:grid-cols-3 gap-6 h-full w-full no-scrollbar no-scrollbar::-webkit-scrollbar">
						{subscriptionPlans.map((plan) => (
							<div
								key={plan.id}
								className={`bg-white rounded-lg border-2 transition-all h-full w-full min-w-[17rem] min-h-75 ${plan.isActive
									? "border-[#B2D0C6]"
									: "border-gray-200 hover:border-gray-300"
									}`}
							>
								<div className="p-6 flex flex-col gap-4">
									{/* Plan Header */}
									<div className="flex items-center justify-between">
										<h3 className="text-[1.125rem] md:text-[1.313rem] font-semibold text-[#474E5C]">{plan.name}</h3>
										{plan.isActive && (
											<span className="px-[0.625rem] py-1 bg-[#ECF4F1] text-[#295547] text-sm font-medium rounded-full">
												Active Plan
											</span>
										)}
									</div>

									{/* Price */}
									<div className="border-b border-[#EAEAEA] pb-4">
										<div className="flex gap-1 items-baseline text-[#474E5C]">
											<span className="text-[1.313rem] md:text-[1.75rem] font-medium">
												{formatPrice(plan.price, plan.currency)}
											</span>
											<span className="text-base md:text-[1.125rem] font-normal">/{plan.period}</span>
										</div>
									</div>

									{/* Features */}
									<div className="space-y-3">
										{plan.features.map((feature, index) => (
											<div key={index} className="flex items-center gap-[0.625rem]">
												<div className="w-4 h-4 bg-[#448C74] rounded-full flex items-center justify-center flex-shrink-0">
													<Check className="w-3 h-3 text-white" />
												</div>
												<span className=" text-sm md:text-base font-normal text-[#474E5C]">{feature}</span>
											</div>
										))}
									</div>

									{/* Action Button */}
									{!plan.isActive && (
										<button
											onClick={() => handleUpgrade(plan.id)}
											className="w-full py-2 px-4 bg-[#448C74] text-white font-medium rounded-lg hover:bg-[#357a63] transition-colors"
										>
											Upgrade
										</button>
									)}
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Billing History Section */}
				<div className="bg-white rounded-lg shadow-sm">
					<div className="">
						<div className="flex items-center gap-2 h-15 px-4 border-b border-[#E9EAEB]">
							<h2 className="md:text-[1.313rem] font-medium text-[#212A3B]">Billing History</h2>
							<span className="w-8 h-8 flex items-center justify-center border border-[#E9EAEB] bg-[#F6F9FC] text-[#474E5C] text-base font-medium rounded-full">
								{billingHistory.length}
							</span>
						</div>

						{/* Table */}
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b border-[#E9EAEB]">
										<th className="text-left h-14 px-4 text-sm md:text-base font-medium text-[#7E838D]">Invoice ID</th>
										<th className="text-left h-14 px-4 text-sm md:text-base font-medium text-[#7E838D]">Plan</th>
										<th className="text-left h-14 px-4 text-sm md:text-base font-medium text-[#7E838D]">Amount</th>
										<th className="text-left h-14 px-4 text-sm md:text-base font-medium text-[#7E838D]">Date Created</th>
										<th className="text-left h-14 px-4 text-sm md:text-base font-medium text-[#7E838D]">Status</th>
										<th className="text-left h-14 px-4 text-sm md:text-base font-medium text-[#7E838D]"></th>
									</tr>
								</thead>
								<tbody>
									{billingHistory.map((record) => (
										<tr key={record.id} className={`border-b border-[#E9EAEB] hover:bg-gray-50 ${record.status === "failed" && "bg-[#ECF4F1]"}`}>
											<td className="h-15 px-4 py-[1.125rem] text-xs md:text-base text-[#474E5C]">{record.invoiceId}</td>
											<td className="h-15 px-4 py-[1.125rem] text-xs md:text-base text-[#474E5C]">{record.plan}</td>
											<td className="h-15 px-4 py-[1.125rem] text-xs md:text-base text-[#474E5C]">{formatPrice(record.amount, record.currency)}</td>
											<td className="h-15 px-4 py-[1.125rem] text-xs md:text-base text-[#474E5C]">{record.dateCreated}</td>
											<td className="px-4 py-[1.125rem]">
												<div className="flex items-center gap-2">
													{
														<>
															{record.status === "paid" ?
																<div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 bg-[#448C74]`}>
																	<Check className={`w-3 h-3 text-white`} />
																</div>
																:
																<div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 bg-[#FC3B3B]`}>
																	<X className={`w-3 h-3 text-white`} />
																</div>}
														</>}

													<span
														className={`text-base font-normal ${record.status === "paid" ? "text-[#448C74]" : "text-[#FC3B3B]"
															}`}
													>
														{record.status === "paid" ? "Paid" : "Failed"}
													</span>
												</div>
											</td>
											<td className="py-4 px-4">
												<button className="p-1 hover:bg-gray-100 rounded">
													<MoreHorizontal className="w-4 h-4 text-gray-400" />
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>

				{/* Upgrade CTA (Bottom) incase need be to be added*/}
				{/* <div className="mt-8 bg-[#448C74] rounded-lg p-6 text-white">
					<div className="flex items-start gap-4">
						<div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
							<Lightbulb className="w-5 h-5 text-white" />
						</div>
						<div className="flex-1">
							<h3 className="font-medium mb-2">Get detailed property information, upgrade to pro</h3>
							<p className="text-white text-opacity-90 text-sm mb-4">
								Unlock advanced features and get more detailed insights about your properties.
							</p>
							<button className="px-4 py-2 bg-white text-[#448C74] font-medium rounded-lg hover:bg-gray-100 transition-colors">
								Upgrade to pro
							</button>
						</div>
					</div>
				</div> */}
			</div>
		</div>
	)
}
