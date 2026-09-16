"use client"

import { useState } from "react"
import { ArrowLeft, ChevronDown } from "lucide-react"
import { Sidebar } from "@/app/components/dashboard/admin/sidebar"
import { Header } from "@/app/components/dashboard/header"
import { useLayoutContext } from "@/app/ProviderLayout"
import { BackNavButton } from "@/app/components/backNavButton"
import { mockMangaerProfile } from "./mock-data"

const statusOptions = ["Active", "Inactive", "Suspended"]
const roleOptions = ["User", "Admin", "Manager", "Agent"]


export default function Page() {
	const { user } = useLayoutContext()
	const [status, setStatus] = useState(mockMangaerProfile?.status || "active")
	const [role, setRole] = useState(mockMangaerProfile?.role)
	const [isStatusOpen, setIsStatusOpen] = useState(false)
	const [isRoleOpen, setIsRoleOpen] = useState(false)
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
	const [activeTab, setActiveTab] = useState<"profile" | "permissions">("profile")
	const [formData, setFormData] = useState({
		status: mockMangaerProfile.status,
		role: mockMangaerProfile.role,
		notes: "",
		additionalInfo: "",
	})
	const [dropdowns, setDropdowns] = useState({
		status: false,
		role: false,
	})

	const handleSubmit = () => {
		console.log({
			...formData,
			tab: activeTab,
		})
	}

	const handleSaveChanges = () => {
		console.log({
			status: formData.status,
			role: formData.role,
		})
	}

	const hasChanges = formData.status !== mockMangaerProfile.status || formData.role !== mockMangaerProfile.role


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

				<main className="flex-1 overflow-auto p-4 lg:p-6">

					<div className="min-h-screen bg-gray-50">
						<div className="flex justify-center px-4 py-3">
							<div className="w-full max-w-6xl md:px-6 flex flex-col md:flex-row items-center justify-between">
								<div className="flex items-center self-start gap-4">
									<BackNavButton />

								</div>
								<div className="flex items-center gap-8">
									<button
										onClick={() => setActiveTab("profile")}
										className={`pb-2 px-1 border-b-2 font-medium transition-colors cursor-pointer ${activeTab === "profile"
											? "border-[#448C74] text-[#448C74]"
											: "border-transparent text-gray-500 hover:text-gray-700"
											}`}
									>
										Profile & KYC
									</button>
									<button
										onClick={() => setActiveTab("permissions")}
										className={`pb-2 px-1 border-b-2 font-medium transition-colors cursor-pointer ${activeTab === "permissions"
											? "border-[#448C74] text-[#448C74]"
											: "border-transparent text-gray-500 hover:text-gray-700"
											}`}
									>
										Permissions
									</button>
								</div>
							</div>
						</div>

						<div className="max-w-6xl mx-auto p-4 lg:p-6">
							{/* Profile & KYC Tab */}
							{activeTab === "profile" && (
								<div className="space-y-8">
									{/* Personal Information */}
									<div>
										<h2 className="text-lg font-medium text-[#474E5C] mb-4">Personal Information</h2>
										<div className="bg-white rounded-lg border p-6">
											<div className="flex justify-between items-start mb-8">
												<div className="w-32 h-32 rounded-full overflow-hidden">
													<img
														src={mockMangaerProfile.avatar || "/placeholder.svg?height=128&width=128"}
														alt={`${mockMangaerProfile.firstName} ${mockMangaerProfile.lastName}`}
														className="w-full h-full object-cover"
													/>
												</div>
												<div className="flex items-center">
													<span className="inline-flex self-end items-center px-1 py-[0.125rem] rounded-[0.5rem] text-base font-medium bg-[#FFE5B6] text-[#785109]">
														KYC Pending
													</span>
												</div>
											</div>

											{/* Personal Details Grid */}
											<div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
												<div>
													<label className="block text-sm font-medium text-gray-500 mb-1">First Name</label>
													<p className="text-gray-900 font-medium">{mockMangaerProfile.firstName}</p>
												</div>
												<div>
													<label className="block text-sm font-medium text-gray-500 mb-1">Last Name</label>
													<p className="text-gray-900 font-medium">{mockMangaerProfile.lastName}</p>
												</div>
												<div>
													<label className="block text-sm font-medium text-gray-500 mb-1">Username</label>
													<p className="text-gray-900 font-medium">{mockMangaerProfile.username}</p>
												</div>
												<div>
													<label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
													<p className="text-gray-900 font-medium">{mockMangaerProfile.email}</p>
												</div>
												<div>
													<label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
													<p className="text-gray-900 font-medium">{mockMangaerProfile.phoneNumber}</p>
												</div>
												<div>
													<label className="block text-sm font-medium text-gray-500 mb-1">Role</label>
													<p className="text-gray-900 font-medium">{mockMangaerProfile.role}</p>
												</div>
												<div>
													<label className="block text-sm font-medium text-gray-500 mb-1">Bank Name</label>
													<p className="text-gray-900 font-medium">{mockMangaerProfile.bankName}</p>
												</div>
												<div>
													<label className="block text-sm font-medium text-gray-500 mb-1">Account Number</label>
													<p className="text-gray-900 font-medium">{mockMangaerProfile.accountNumber}</p>
												</div>
												<div>
													<label className="block text-sm font-medium text-gray-500 mb-1">Account Name</label>
													<p className="text-gray-900 font-medium">{mockMangaerProfile.accountName}</p>
												</div>
											</div>
										</div>
									</div>

									{/* KYC Information */}
									<div>
										<h2 className="text-lg font-medium text-[#474E5C] mb-4">KYC Information</h2>
										<div className="bg-white rounded-lg border p-6">

											<div className="space-y-6">
												<div>
													<label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
													<p className="text-gray-900 font-medium">{mockMangaerProfile.address}</p>
												</div>

												<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
													<div>
														<label className="block text-sm font-medium text-gray-500 mb-1">Education qualification</label>
														<p className="text-gray-900 font-medium">{mockMangaerProfile.educationQualification}</p>
													</div>
													<div>
														<label className="block text-sm font-medium text-gray-500 mb-1">Verification Method</label>
														<p className="text-gray-900 font-medium">{mockMangaerProfile.verificationMethod}</p>
													</div>
													<div>
														<label className="block text-sm font-medium text-gray-500 mb-1">Account Name</label>
														<p className="text-gray-900 font-medium">{mockMangaerProfile.kycAccountName}</p>
													</div>
												</div>

												{/* Additional Information */}
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-2">Additional Information</label>
													<textarea
														value={formData.additionalInfo}
														onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
														rows={6}
														className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none resize-none"
														placeholder="Enter additional information..."
													/>
												</div>

												{/* Status Dropdown */}
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
													<div className="relative">
														<button
															onClick={() => setDropdowns({ ...dropdowns, status: !dropdowns.status })}
															className="cursor-pointer w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg outline-none flex items-center justify-between"
														>
															<span className="text-gray-500">{formData.status}</span>
															<ChevronDown className="w-5 h-5 text-gray-400" />
														</button>

														{dropdowns.status && (
															<div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
																{statusOptions.map((option) => (
																	<button
																		key={option}
																		onClick={() => {
																			setFormData({ ...formData, status: option })
																			setDropdowns({ ...dropdowns, status: false })
																		}}
																		className="cursor-pointer w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none first:rounded-t-lg last:rounded-b-lg"
																	>
																		{option}
																	</button>
																))}
															</div>
														)}
													</div>
												</div>

												<div>
													<label className="block text-sm font-medium text-gray-700 mb-2">Leave a note</label>
													<textarea
														value={formData.notes}
														onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
														rows={4}
														className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none resize-none"
														placeholder="Enter your notes..."
													/>
												</div>

												{/* Submit Button */}
												<div className="flex justify-end">
													<button
														onClick={handleSubmit}
														className="px-8 py-3 bg-[#448C74] hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
													>
														Submit
													</button>
												</div>
											</div>
										</div>
									</div>
								</div>
							)}

							{activeTab === "permissions" && (
								<div className="bg-white rounded-lg border p-6">
									<div className="flex items-center justify-between mb-8">
										<h2 className="text-lg font-medium text-[#474E5C] mb-4">Personal Information</h2>
										<span className="inline-flex items-center px-1 py-[0.125rem] rounded-[0.5rem] text-base font-medium bg-[#FFE5B6] text-[#785109]">
											KYC Pending
										</span>
									</div>

									<div className="flex justify-start mb-8">
										<div className="w-32 h-32 rounded-full overflow-hidden">
											<img
												src={mockMangaerProfile.avatar || "/placeholder.svg?height=128&width=128"}
												alt={`${mockMangaerProfile.firstName} ${mockMangaerProfile.lastName}`}
												className="w-full h-full object-cover"
											/>
										</div>
									</div>

									{/* Status and Role Dropdowns */}
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
										{/* Status Dropdown */}
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
											<div className="relative">
												<button
													onClick={() => setDropdowns({ ...dropdowns, status: !dropdowns.status })}
													className="cursor-pointer w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg outline-none flex items-center justify-between">
													<span className="text-gray-500">{formData.status}</span>
													<ChevronDown className="w-5 h-5 text-gray-400" />
												</button>
												{dropdowns.status && (
													<div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
														{statusOptions.map((option) => (
															<button
																key={option}
																onClick={() => {
																	setFormData({ ...formData, status: option })
																	setDropdowns({ ...dropdowns, status: false })
																}}
																className="cursor-pointer w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none first:rounded-t-lg last:rounded-b-lg"
															>
																{option}
															</button>
														))}
													</div>
												)}
											</div>
										</div>

										{/* Role Dropdown */}
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
											<div className="relative">
												<button
													onClick={() => setDropdowns({ ...dropdowns, role: !dropdowns.role })}
													className="cursor-pointer w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg outline-none flex items-center justify-between"
												>
													<span className="text-gray-500">{formData.role}</span>
													<ChevronDown className="w-5 h-5 text-gray-400" />
												</button>

												{dropdowns.role && (
													<div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
														{roleOptions.map((option) => (
															<button
																key={option}
																onClick={() => {
																	setFormData({ ...formData, role: option })
																	setDropdowns({ ...dropdowns, role: false })
																}}
																className="cursor-pointer w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none first:rounded-t-lg last:rounded-b-lg"
															>
																{option}
															</button>
														))}
													</div>
												)}
											</div>
										</div>
									</div>

									{/* Save Changes Button */}
									<div className="flex justify-end">
										<button
											onClick={handleSaveChanges}
											disabled={!hasChanges}
											className="px-8 py-3 bg-[#448C74] hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
										>
											Save changes
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				</main>
			</div>
		</div>
	)
}
