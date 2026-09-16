
"use client"

import BuildingMaterialCost from "@/app/components/dashboard/agent/building-material-cost"
import { Header } from "@/app/components/dashboard/header"
import { useLayoutContext } from "@/app/ProviderLayout"
import { use, useState } from "react"
import ExpertReview from "@/app/components/dashboard/agent/expert-review"
import StatePolicyUpdate from "@/app/components/dashboard/agent/state-policy-update"
import Landmarks from "@/app/components/dashboard/agent/landmarks"
import WordOnStreet from "@/app/components/dashboard/agent/word-on-street"
import CommunityUpdate from "@/app/components/dashboard/agent/community-update"
import VulnerabilityTest from "@/app/components/dashboard/agent/vulnerability-test"
import { Sidebar } from "@/app/components/dashboard/agent/sidebar"
interface PropertyPageProps {
	params: Promise<{
		id: string;
		type: string;
	}>;
};

export default function PropertyPage({ params }: PropertyPageProps) {
	const { type } = use(params)
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
	const { user } = useLayoutContext()
 

	const COMPONENTS: Record<string, React.ReactNode> = {
		"material-cost": <BuildingMaterialCost />,
		"expert-review": <ExpertReview />,
		"policy-update": <StatePolicyUpdate />,
		landmarks: <Landmarks />,
		"word-on-street": <WordOnStreet />,
		"community-update": <CommunityUpdate />,
		"vulnerability-test": <VulnerabilityTest />,
	}

	const [activeTab, setActiveTab] = useState(type ?? "material-cost")


	return (
		<div className="flex h-screen bg-gray-50">
			{/* Desktop Sidebar */}
			<Sidebar className="hidden lg:block" />

			{/* Mobile Sidebar Overlay */}
			{isMobileMenuOpen && (
				<div className="fixed inset-0 z-50 lg:hidden">
					<div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
					<Sidebar className="relative z-50" onClose={() => setIsMobileMenuOpen(false)} showCloseButton={true} />
				</div>
			)}

			{/* Main Content */}
			<div className="flex-1 flex flex-col overflow-hidden">
				<Header onMenuClick={() => setIsMobileMenuOpen(true)} isMobile={true} user={user} />
				<main className="flex-1 overflow-auto p-4 lg:p-4">

					<div>
						{COMPONENTS[activeTab]}
					</div>
				</main>
			</div>
		</div>
	)
}
 