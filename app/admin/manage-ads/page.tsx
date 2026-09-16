"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Ad } from "@/libs/interface"
import { Sidebar } from "@/app/components/dashboard/admin/sidebar"
import { Header } from "@/app/components/dashboard/header"
import { AdCard } from "@/app/components/ads/ads-card"
import { CreateAdModal } from "@/app/components/ads/create-ads-modal"
import { useLayoutContext } from "@/app/ProviderLayout"

const initialAds: Ad[] = [
	{
		id: "1",
		title: "Do more for your Brand!",
		description: "Create a marketing campaign to attract more customers.",
		status: "active",
		createdAt: new Date("2024-01-15"),
	},
	{
		id: "2",
		title: "Do more for your Brand!",
		description: "Create a marketing campaign to attract more customers.",
		status: "active",
		createdAt: new Date("2024-01-14"),
	},
	{
		id: "3",
		title: "Do more for your Brand!",
		description: "Create a marketing campaign to attract more customers.",
		status: "active",
		createdAt: new Date("2024-01-13"),
	},
	{
		id: "4",
		title: "Do more for your Brand!",
		description: "Create a marketing campaign to attract more customers.",
		status: "active",
		createdAt: new Date("2024-01-12"),
	},
	{
		id: "5",
		title: "Previous Campaign",
		description: "An archived marketing campaign.",
		status: "archived",
		createdAt: new Date("2024-01-10"),
	},
]

export default function ManageAdsPage() {
	const [ads, setAds] = useState<Ad[]>(initialAds)
	const { user } = useLayoutContext()
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
	const [isMobile, setIsMobile] = useState(false)
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
	const [editingAd, setEditingAd] = useState<Ad | null>(null)
	const [activeTab, setActiveTab] = useState("active")

	const activeAds = ads.filter((ad) => ad.status === "active")
	const archivedAds = ads.filter((ad) => ad.status === "archived")

	const handleCreateAd = (newAdData: Omit<Ad, "id" | "createdAt">) => {
		const newAd: Ad = {
			...newAdData,
			id: Date.now().toString(),
			createdAt: new Date(),
		}
		setAds((prev) => [newAd, ...prev])
	}

	const handleEditAd = (ad: Ad) => {
		setEditingAd(ad)
		setIsCreateModalOpen(true)
	}

	const handleUpdateAd = (updatedAdData: Omit<Ad, "id" | "createdAt">) => {
		if (!editingAd) return

		setAds((prev) => prev.map((ad) => (ad.id === editingAd.id ? { ...ad, ...updatedAdData } : ad)))
		setEditingAd(null)
	}

	const handleArchiveAd = (ad: Ad) => {
		setAds((prev) => prev.map((a) => (a.id === ad.id ? { ...a, status: "archived" as const } : a)))
	}

	const handleDeleteAd = (ad: Ad) => {
		setAds((prev) => prev.filter((a) => a.id !== ad.id))
	}

	const handleCloseModal = () => {
		setIsCreateModalOpen(false)
		setEditingAd(null)
	}

	return (
		<div className="flex h-screen bg-gray-50">
			<Sidebar className="hidden lg:block" />
			{isMobileMenuOpen && (
				<div className="fixed inset-0 z-50 lg:hidden">
					<div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
					<Sidebar className="relative z-50" onClose={() => setIsMobileMenuOpen(false)} showCloseButton={true} />
				</div>
			)}
			<div className="flex-1 flex flex-col overflow-hidden">
				<Header onMenuClick={() => setIsMobileMenuOpen(true)} isMobile={true} user={user} />

				<main className="p-4 lg:p-6">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
						<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
							<TabsList className="grid w-full grid-cols-2 sm:w-auto bg-transparent">
								<TabsTrigger value="active" className="cursor-pointer flex items-center gap-2">
									Active Ads
									<span className={`px-2 py-0.5 rounded-full text-xs font-medium ${activeTab == "active" && "bg-[#E6F3EE] text-[#028755]"}`}>
										{activeAds.length}
									</span>
								</TabsTrigger>
								<TabsTrigger value="history" className="flex items-center gap-2 cursor-pointer">
									Ads History
									<span className={`px-2 py-0.5 rounded-full text-xs font-medium ${activeTab == "history" && "bg-[#E6F3EE] text-[#028755]"}`}>
										{archivedAds.length}
									</span>
								</TabsTrigger>
							</TabsList>
						</Tabs>

						<Button
							onClick={() => setIsCreateModalOpen(true)}
							className="bg-[#448C74] hover:bg-[#448C7C] cursor-pointer text-white gap-2 w-full sm:w-auto"
						>
							<Plus className="w-4 h-4" />
							New Ads
						</Button>
					</div>

					<Tabs value={activeTab} onValueChange={setActiveTab}>
						<TabsContent value="active" className="mt-0">
							{activeAds.length > 0 ? (
								<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
									{activeAds.map((ad) => (
										<AdCard
											key={ad.id}
											ad={ad}
											onEdit={handleEditAd}
											onArchive={handleArchiveAd}
											onDelete={handleDeleteAd}
										/>
									))}
								</div>
							) : (
								<div className="text-center py-12">
									<p className="text-gray-500 mb-4">No active ads found</p>
									<Button
										onClick={() => setIsCreateModalOpen(true)}
										className="bg-green-600 hover:bg-green-700 text-white"
									>
										Create your first ad
									</Button>
								</div>
							)}
						</TabsContent>

						<TabsContent value="history" className="mt-0">
							{archivedAds.length > 0 ? (
								<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
									{archivedAds.map((ad) => (
										<AdCard
											key={ad.id}
											ad={ad}
											onEdit={handleEditAd}
											onArchive={handleArchiveAd}
											onDelete={handleDeleteAd}
										/>
									))}
								</div>
							) : (
								<div className="text-center py-12">
									<p className="text-gray-500">No archived ads found</p>
								</div>
							)}
						</TabsContent>
					</Tabs>
				</main>
			</div>

			<CreateAdModal
				isOpen={isCreateModalOpen}
				onClose={handleCloseModal}
				onSubmit={editingAd ? handleUpdateAd : handleCreateAd}
				editingAd={editingAd}
			/>
		</div>
	)
}
