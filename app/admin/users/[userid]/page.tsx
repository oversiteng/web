"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Sidebar } from "@/app/components/dashboard/admin/sidebar"
import { Header } from "@/app/components/dashboard/header"
import { useLayoutContext } from "@/app/ProviderLayout"
import { BackNavButton } from "@/app/components/backNavButton"

interface UserProfile {
	firstName: string
	lastName: string
	username: string
	email: string
	phoneNumber: string
	joinedOn: string
	subscriptionPlan: string
	subscriptionExpiry: string
	status: string
	role: string
	avatar: string
}

const statusOptions = ["Active", "Inactive", "Suspended"]
const roleOptions = ["User", "Admin", "Manager", "Agent"]

const mockUser: UserProfile = {
	avatar: "/prop-value-profile-img.jpg",
	firstName: "Timothy",
	lastName: "Daniels",
	username: "Tim",
	email: "hello@oversite.com",
	phoneNumber: "080123456890",
	joinedOn: "2023-01-15",
	subscriptionPlan: "Basic Plan",
	subscriptionExpiry: "N/A",
	status: "Active",
	role: "User",
}

export default function Page() {
	const { user } = useLayoutContext()
	const [status, setStatus] = useState(mockUser?.status || "active")
	const [role, setRole] = useState(mockUser?.role)
	const [isStatusOpen, setIsStatusOpen] = useState(false)
	const [isRoleOpen, setIsRoleOpen] = useState(false)
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

	const handleSave = () => {
		console.log({ status, role })
	}

	const hasChanges = status !== mockUser?.status || "active" || role !== mockUser?.role

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
					<div className="mx-4 mb-4">
						<BackNavButton />
					</div>

					<div className={`bg-white rounded-lg border max-w-5xl m-auto`}>
						<div className="p-6 border-b">
							<h2 className="text-lg font-medium text-[#474E5C] mb-6">Profile Information</h2>

							<div className="flex justify-start mb-8">
								<div className="w-32 h-32 rounded-full overflow-hidden">
									<img
										src={mockUser?.avatar}
										alt={`${mockUser?.firstName} ${mockUser?.lastName}`}
										className="w-full h-full object-cover"
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
								<div>
									<label className="block text-sm font-normal text-[#7E838D] mb-1">First Name</label>
									<p className="text-[#474E5C] text-sm font-medium">{mockUser?.firstName}</p>
								</div>

								<div>
									<label className="block text-sm font-normal text-[#7E838D] mb-1">Last Name</label>
									<p className="text-[#474E5C] text-sm font-medium">{mockUser?.lastName}</p>
								</div>

								<div>
									<label className="block text-sm font-normal text-[#7E838D] mb-1">Username</label>
									<p className="text-[#474E5C] text-sm font-medium">{mockUser?.username}</p>
								</div>

								<div className="md:col-span-2">
									<label className="block text-sm font-normal text-[#7E838D] mb-1">Email</label>
									<p className="text-[#474E5C] text-sm font-medium">{mockUser?.email}</p>
								</div>

								<div>
									<label className="block text-sm font-normal text-[#7E838D] mb-1">Phone Number</label>
									<p className="text-[#474E5C] text-sm font-medium">{mockUser?.phoneNumber}</p>
								</div>

								<div>
									<label className="block text-sm font-normal text-[#7E838D] mb-1">Joined on</label>
									<p className="text-[#474E5C] text-sm font-medium">{mockUser?.joinedOn}</p>
								</div>

								<div>
									<label className="block text-sm font-normal text-[#7E838D] mb-1">Subscription Plan</label>
									<p className="text-[#474E5C] text-sm font-medium">{mockUser?.subscriptionPlan}</p>
								</div>

								<div>
									<label className="block text-sm font-normal text-[#7E838D] mb-1">Subscription Expiry</label>
									<p className="text-[#474E5C] text-sm font-medium">{mockUser?.subscriptionExpiry}</p>
								</div>

							</div>
						</div>

						<div className="p-6 space-y-6">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
								<div className="relative">
									<button
										onClick={() => setIsStatusOpen(!isStatusOpen)}
										className="cursor-pointer w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg outline-none flex items-center justify-between"
									>
										<span className="text-gray-900">{status}</span>
										<ChevronDown className="w-5 h-5 text-gray-400" />
									</button>

									{isStatusOpen && (
										<div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
											{statusOptions.map((option) => (
												<button
													key={option}
													onClick={() => {
														setStatus(option)
														setIsStatusOpen(false)
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
								<label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
								<div className="relative">
									<button
										onClick={() => setIsRoleOpen(!isRoleOpen)}
										className="cursor-pointer w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg outline-none flex items-center justify-between"
									>
										<span className="text-gray-900">{role}</span>
										<ChevronDown className="w-5 h-5 text-gray-400" />
									</button>

									{isRoleOpen && (
										<div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
											{roleOptions.map((option) => (
												<button
													key={option}
													onClick={() => {
														setRole(option)
														setIsRoleOpen(false)
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

							<div className="flex justify-end">
								<button
									onClick={handleSave}
									disabled={!hasChanges}
									className="cursor-pointer px-8 py-3 bg-[#448C74] disabled:bg-[#B2D0C6] disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
								>
									Save changes
								</button>
							</div>
						</div>
					</div>
				</main>
			</div>
		</div>
	)
}
