"use client"

import { useState } from "react"
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import { User } from "@/libs/interface"
import { Sidebar } from "@/app/components/dashboard/admin/sidebar"
import { Header } from "@/app/components/dashboard/header"
import { useLayoutContext } from "@/app/ProviderLayout"
import { Pagination } from "@/app/components/pagination"
import { useRouter } from "next/navigation"

const mockManagers: User[] = [
	{
		id: "1",
		fullname: "Alice Johnson",
		username: "alice.j",
		phone: "+234903123456",
		joinedAt: "Jul 21, 2023",
		email: "alice.j@example.com",
		status: "active"
	},
	{
		id: "2",
		fullname: "Bob Smith",
		username: "bobby_s",
		phone: "+23490234567",
		joinedAt: "Oct 10, 2023",
		email: "bob.smith@example.com",
		status: "active"
	},
	{
		id: "3",
		fullname: "David Brown",
		username: "dandDaveb",
		phone: "Cabin+2349035467282",
		joinedAt: "Sep 05, 2023",
		email: "david.brown@gmail.com",
		status: "active"
	},
	{
		id: "4",
		fullname: "Bob Smith",
		username: "bobby_s",
		phone: "+23490234567",
		joinedAt: "Oct 10, 2023",
		email: "bob.smith@example.com",
		status: "active"
	},
	{
		id: "5",
		fullname: "Hannah Kim",
		username: "hannah.k",
		phone: "+234802345678",
		joinedAt: "Oct 22, 2023",
		email: "hannah.kim@example.com",
		status: "active"
	},
	{
		id: "6",
		fullname: "Hannah Kim",
		username: "hannah.k",
		phone: "+234802345678",
		joinedAt: "Oct 22, 2023",
		email: "hannah.kim@example.com",
		status: "active"
	},
	{
		id: "7",
		fullname: "Hannah Kim",
		username: "hannah.k",
		phone: "+234802345678",
		joinedAt: "Oct 22, 2023",
		email: "hannah.kim@example.com",
		status: "active"
	},
	{
		id: "8",
		fullname: "Hannah Kim",
		username: "hannah.k",
		phone: "+234802345678",
		joinedAt: "Oct 22, 2023",
		email: "hannah.kim@example.com",
		status: "active"
	},
	{
		id: "9",
		fullname: "Hannah Kim",
		username: "hannah.k",
		phone: "+234802345678",
		joinedAt: "Oct 22, 2023",
		email: "hannah.kim@example.com",
		status: "active"
	},
	{
		id: "10",
		fullname: "Hannah Kim",
		username: "hannah.k",
		phone: "+234802345678",
		joinedAt: "Oct 22, 2023",
		email: "hannah.kim@example.com",
		status: "suspended"
	},
	{
		id: "11",
		fullname: "Hannah Kim",
		username: "hannah.k",
		phone: "+234802345678",
		joinedAt: "Oct 22, 2023",
		email: "hannah.kim@example.com",
		status: "suspended"
	},
	{
		id: "12",
		fullname: "Hannah Kim",
		username: "hannah.k",
		phone: "+234802345678",
		joinedAt: "Oct 22, 2023",
		email: "hannah.kim@example.com",
		status: "active"
	},
	{
		id: "13",
		fullname: "Hannah Kim",
		username: "hannah.k",
		phone: "+234802345678",
		joinedAt: "Oct 22, 2023",
		email: "hannah.kim@example.com",
		status: "active"
	},
	{
		id: "14",
		fullname: "Hannah Kim",
		username: "hannah.k",
		phone: "+234802345678",
		joinedAt: "Oct 22, 2023",
		email: "hannah.kim@example.com",
		status: "suspended"
	},
	{
		id: "15",
		fullname: "Hannah Kim",
		username: "hannah.k",
		phone: "+234802345678",
		joinedAt: "Oct 22, 2023",
		email: "hannah.kim@example.com",
		status: "active"
	},

	{
		id: "16",
		fullname: "Alice Johnson",
		username: "alice.j",
		phone: "+234903123456",
		joinedAt: "Jul 21, 2023",
		email: "alice.j@example.com",
		status: "suspended"
	},
	{
		id: "17",
		fullname: "Sunset Paradise",
		username: "Waterfront",
		phone: "Villa",
		joinedAt: "Aug 15, 2023",
		email: "suspended",
		status: "active"
	},
	{
		id: "18",
		fullname: "David Brown",
		username: "daveb",
		phone: "+2349035467282",
		joinedAt: "Sep 10, 2023",
		email: "david.brown@gmail.com",
		status: "active"
	},
	{
		id: "19",
		fullname: "Bob Smith",
		username: "bobby_s",
		phone: "+23490234567",
		joinedAt: "Oct 10, 2023",
		email: "bob.smith@example.com",
		status: "active"
	},
	{
		id: "20",
		fullname: "Alice Johnson",
		username: "alice.j",
		phone: "+234903123456",
		joinedAt: "Jul 21, 2023",
		email: "alice.j@example.com",
		status: "active"
	},
]

export default function UsersListsPage() {
	const { user } = useLayoutContext()
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
	const [activeTab, setActiveTab] = useState("active")
	const [searchTerm, setSearchTerm] = useState("")
	const [currentPage, setCurrentPage] = useState(1)
	const itemsPerPage = 10
	const router = useRouter()
	const activeManagers = mockManagers.filter((p) => p.status === "active")
	const suspendedProperties = mockManagers.filter((p) => p.status === "suspended")

	const currentUsers = activeTab === "active" ? activeManagers : suspendedProperties
	const filteredUsers = currentUsers.filter(
		(users) =>
			users.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
			users.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
			users.phone.toLowerCase().includes(searchTerm.toLowerCase()),
	)

	const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
	const startIndex = (currentPage - 1) * itemsPerPage
	const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage)

	const handlePageChange = (page: number) => {
		setCurrentPage(page)
	}
	const openUserProfile = (page: string) => {
		router.push(`managers/${page}`)
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

				<main className="flex-1 overflow-auto p-4 lg:p-6">
					<div className="flex items-center gap-3 md:hidden w-full mb-[0.938rem]">
						<div className="relative w-full">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
							<input
								type="text"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								placeholder="Search"
								className="pl-10 pr-4 py-2 bg-[#F6F9FC] border border-[#E9EAEB] rounded-[3.625rem] outline-none w-full"
							/>
						</div>
						<button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50">
							<Filter className="w-4 h-4" />
							<span>Filters</span>
						</button>
					</div>
					<div className="bg-white rounded-lg shadow-sm border">
						<div className="p-6 border-b">
							<div className="flex flex-row justify-between gap-4">
								<div className="flex items-center gap-8">
									<button
										onClick={() => {
											setActiveTab("active")
											setCurrentPage(1)
										}}
										className={`flex items-center gap-2 pb-2 border-b-2 transition-colors cursor-pointer ${activeTab === "active"
											? "border-[#028755] text-[#028755]"
											: "border-transparent text-gray-500 hover:text-gray-700"
											}`}
									>
										<span className="font-medium">Active Manager</span>
										<span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-sm">
											{activeManagers.length}
										</span>
									</button>
									<button
										onClick={() => {
											setActiveTab("suspended")
											setCurrentPage(1)
										}}
										className={`flex items-center gap-2 pb-2 border-b-2 transition-colors cursor-pointer ${activeTab === "suspended"
											? "border-[#028755] text-[#028755]"
											: "border-transparent text-gray-500 hover:text-gray-700"
											}`}
									>
										<span className="font-medium">Suspended Manager</span>
										<span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-sm">
											{suspendedProperties.length}
										</span>
									</button>
								</div>

								<div className="md:flex items-center gap-3 hidden ">
									<div className="relative">
										<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
										<input
											type="text"
											value={searchTerm}
											onChange={(e) => setSearchTerm(e.target.value)}
											placeholder="Search"
											className="pl-10 pr-4 py-2 bg-[#F6F9FC] border border-[#E9EAEB] rounded-[3.625rem] outline-none w-64"
										/>
									</div>
									<button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50">
										<Filter className="w-4 h-4" />
										<span>Filters</span>
									</button>
								</div>
							</div>
						</div>

						{/* Desktop Table View */}
						<div className="hidden md:block overflow-x-auto">
							<table className="w-full min-w-6xl">
								<thead className="bg-gray-50">
									<tr>
										<th className="text-left py-3 px-6 font-medium text-gray-700">Full Name</th>
										<th className="text-left py-3 px-6 font-medium text-gray-700">Username</th>
										<th className="text-left py-3 px-6 font-medium text-gray-700">phone</th>
										<th className="text-left py-3 px-6 font-medium text-gray-700">Email</th>
										<th className="text-left py-3 px-6 font-medium text-gray-700">Joined on</th>
										<th className="text-left py-3 px-6 font-medium text-gray-700"></th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-100">
									{paginatedUsers.map((user) => (
										<tr key={user.id} className="hover:bg-gray-50">
											<td className="py-4 px-6 text-gray-900">{user.fullname}</td>
											<td className="py-4 px-6 text-gray-600">{user.username}</td>
											<td className="py-4 px-6 text-gray-600">{user.phone}</td>
											<td className="py-4 px-6 text-gray-600">{user.email}</td>
											<td className="py-4 px-6 text-gray-600">{user.joinedAt}</td>
											<td className="py-4 px-6">
												<button onClick={() => openUserProfile(user.id)}
													className="cursor-pointer text-[#306251] text-sm h-10 w-[6.938rem] font-normal bg-[#FFFFFF] border border-[#D0D5DD] hover:bg-[#E9EAEB] rounded-lg flex items-center justify-center">
													View Details
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{/* Mobile Card View */}
						<div className="md:hidden divide-y divide-gray-100">
							{paginatedUsers.map((user) => (
								<div key={user.id} className="p-6">
									<div className="space-y-3">
										<div className="flex justify-between items-start">
											<span className="text-sm text-gray-500">Name</span>
											<span className="text-gray-900 font-medium">{user.fullname}</span>
										</div>
										<div className="flex justify-between items-start">
											<span className="text-sm text-gray-500">Type</span>
											<span className="text-gray-600">{user.username}</span>
										</div>
										<div className="flex justify-between items-start">
											<span className="text-sm text-gray-500">Building Type</span>
											<span className="text-gray-600">{user.phone}</span>
										</div>
										<div className="pt-3 flex align-center justify-center">
											<button onClick={() => openUserProfile(user.id)}
												className="cursor-pointer text-[#306251] text-sm font-medium h-10 w-[6.938rem] bg-[#FFFFFF] hover:bg-[#E9EAEB] rounded-lg">
												View Details
											</button>
										</div>
									</div>
								</div>
							))}
						</div>

						<div className="flex items-center justify-center gap-2 p-6 border-t">
							<Pagination currentPage={currentPage} totalPages={totalPages} handlePageChange={handlePageChange} />
						</div>

						{/* Pagination */}

					</div>
				</main>
			</div>
		</div>
	)
}
