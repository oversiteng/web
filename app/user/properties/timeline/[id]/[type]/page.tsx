"use client"

import CommunityUpdate from "@/app/components/dashboard/community-update"
import ExpertReview from "@/app/components/dashboard/expert-review"
import { Header } from "@/app/components/dashboard/header"
import { Sidebar } from "@/app/components/dashboard/sidebar"
import StatePolicyUpdate from "@/app/components/dashboard/state-policy-update"
import WordOnStreet from "@/app/components/dashboard/word-on-street"
import { useLayoutContext } from "@/app/ProviderLayout"
import { useEffect, useState } from "react"
import { use } from 'react';

// Define the type for route parameters manually
interface PropertyPageProps {
	params: Promise<{
		id: string;
		type: string;
	}>;
};

export default function PropertyPage({ params }: PropertyPageProps) {
	const { type } = use(params)
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
	const [isMobile, setIsMobile] = useState(false)
	const { user } = useLayoutContext()

	useEffect(() => {
		const checkScreenSize = () => {
			setIsMobile(window.innerWidth < 768)
		}

		checkScreenSize()
		window.addEventListener("resize", checkScreenSize)

		return () => window.removeEventListener("resize", checkScreenSize)
	}, [])

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
					{type === "policy-updates" && <StatePolicyUpdate />}
					{type === "community-update" && <CommunityUpdate isMobile={isMobile} />}
					{type === "word-on-street" && <WordOnStreet />}
					{type === "expert-review" && <ExpertReview isMobile={isMobile} />}
				</main>
			</div>
		</div>
	)
}
