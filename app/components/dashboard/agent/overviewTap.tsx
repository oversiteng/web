
"use client"

import { useParams, useRouter } from "next/navigation"
import { useState } from "react"

export default function OverviewTab() {
	const { type } = useParams()
	const router = useRouter()
	const NAV_ITEMS = [
		{ label: "Building Material Cost", key: "material-cost" },
		{ label: "Expert Review", key: "expert-review" },
		{ label: "State Policy Update", key: "policy-update" },
		{ label: "Landmarks", key: "landmarks" },
		{ label: "Word on the Street", key: "word-on-street" },
		{ label: "Community update", key: "community-update" },
		{ label: "Request Vulnerability Test", key: "#" },
	]
	const [activeTab, setActiveTab] = useState(type ?? "material-cost")

	const changeTab = (key: any) => {
		router.push(`${key}`)
		setActiveTab(key)
	}
	return (
		<nav className="overflow-x-auto whitespace-nowrap no-scrollbar no-scrollbar::-webkit-scrollbar">
			<ul className="flex space-x-4 py-2">
				{NAV_ITEMS.map((item) => (
					<li key={item.key}>
						<button
							className={`cursor-pointer  px-4 py-2 rounded-[0.625rem] font-medium ${activeTab === item.key
								? "bg-white border border-[#ECF4F1] shadow-md shadow-[#18002C0F] text-[#306251]"
								: "text-gray-600 hover:text-[#448C74]"
								}`}
							onClick={() => changeTab(item.key)}
						>
							{item.label}
						</button>
					</li>
				))}
			</ul>
		</nav>
	)
}

 