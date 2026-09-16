"use client"

import { useState, useEffect } from "react"
import { Bell, Menu, ChevronDown, Building2, Mail, User, HelpCircle, LogOut, X, Play, Home, Hand } from "lucide-react"
import { LayoutContextType } from "@/libs/interface"
import { useLayoutContext } from "@/app/ProviderLayout"

interface HeaderProps {
	onMenuClick?: () => void
	isMobile?: boolean
	user?: LayoutContextType['user']
}

interface Notification {
	id: string
	type: "landmark" | "price" | "onboard"
	title: string
	message: string
	time: string
	date: string
	unread: boolean
}

const mockNotifications: Notification[] = [
	{
		id: "1",
		type: "landmark",
		title: "Oshodi Landmark",
		message: 'We have added a new landmark "Global Estate"',
		time: "7min ago",
		date: "today",
		unread: true,
	},
	{
		id: "2",
		type: "price",
		title: "Cement Price Change",
		message: 'A new building material has been added to "Global..."',
		time: "7min ago",
		date: "today",
		unread: true,
	},
	{
		id: "3",
		type: "landmark",
		title: "Oshodi Landmark",
		message: 'We have added a new landmark "Global Estate"',
		time: "7min ago",
		date: "yesterday",
		unread: false,
	},
	{
		id: "4",
		type: "price",
		title: "Cement Price Change",
		message: 'A new building material has been added to "Global..."',
		time: "7min ago",
		date: "yesterday",
		unread: false,
	},
	{
		id: "5",
		type: "onboard",
		title: "Welcome Onboard",
		message: "Welcome onboard, Oversite.ng is an innovate tool t...",
		time: "7min ago",
		date: "yesterday",
		unread: false,
	},
]

const getNotificationIcon = (type: string) => {
	switch (type) {
		case "landmark":
			return <Play className="h-4 w-4 text-white" />
		case "price":
			return <Home className="h-4 w-4 text-white" />
		case "onboard":
			return <Hand className="h-4 w-4 text-white" />
		default:
			return <Bell className="h-4 w-4 text-white" />
	}
}

export function Header({ onMenuClick, user, isMobile = false }: HeaderProps) {
	const { logoutUserProfile } = useLayoutContext()
	const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
	const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
	const [showNotifications, setShowNotifications] = useState(false)
	const [mounted, setMounted] = useState(false)
	const [pageTitle, setPageTitle] = useState("Dashboard")


	useEffect(() => {

		setMounted(true)

		if (typeof window !== "undefined") {
			const segments = window.location.pathname.replace(/^\/+/, "").split("/")
			const section = segments[1] || ""
			let title = "Dashboard"
			switch (section) {
				case "":
					title = "Dashboard"
					break
				case "listings":
					title = "My Listings"
					break
				case "properties":
					title = "My Properties"
					break
				case "inbox":
					title = "Inbox"
					break
				case "subscription":
					title = "Manage Subscription"
					break
				case "account":
					title = "Account"
					break
				case "privacy":
					title = "Privacy & Security"
					break
				case "help":
					title = "Help Center"
					break
				default:
					title = section.charAt(0).toUpperCase() + section.slice(1)
			}
			setPageTitle(title)
		}
	}, [])

	if (!mounted) {
		return null
	}

	const unreadCount = notifications.filter((n) => n.unread).length

	const markAsRead = (id: string) => {
		setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)))
	}

	const groupedNotifications = notifications.reduce(
		(acc, notification) => {
			const key = notification.date
			if (!acc[key]) {
				acc[key] = []
			}
			acc[key].push(notification)
			return acc
		},
		{} as Record<string, Notification[]>,
	)

	const handleNotificationClick = () => {
		setShowNotifications(!showNotifications)
		// Close user menu if open
		setIsUserMenuOpen(false)
	}

	const handleUserMenuClick = () => {
		setIsUserMenuOpen(!isUserMenuOpen)
		// Close notifications if open
		setShowNotifications(false)
	}



	return (
		<>
			<header className="bg-white px-4 md:px-6 py-4 sticky top-0 z-40">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<button onClick={onMenuClick} className="p-2 bg-gray-100 rounded-lg flex lg:hidden cursor-pointer">
							<Menu className="w-5 h-5 text-[#1C274C]" />
						</button>
						<h1 className="md:text-[1.125rem] font-medium text-[#212A3B] capitalize">
							{pageTitle}
						</h1>
					</div>

					<div className="flex items-center gap-4">
						{/* Notifications */}
						<div className="relative">
							<button onClick={handleNotificationClick} className="relative p-2 hover:bg-gray-100 rounded-lg">
								<Bell className="w-6 h-6 text-gray-600" />
								{unreadCount > 0 && (
									<span className="absolute top-0 right-1 bg-[#64A08C] text-white text-xs font-medium rounded-full w-[1.125rem] h-[1.125rem] flex items-center justify-center">
										{unreadCount}
									</span>
								)}
							</button>

							{/* Desktop notification dropdown */}
							{showNotifications && (
								<div className={"max-sm:fixed max-sm:inset-0 max-sm:flex max-sm:-top-80 max-sm:items-center max-sm:justify-center max-sm:z-50 absolute right-0 mt-2 z-50 shadow-[#1E1E1E1A] shadow-lg"}>

									<div className={"bg-white border border-gray-200 rounded-xl shadow-lg w-[24.5rem] mx-auto max-sm:w-full max-sm:max-w-[calc(100vw-40px)]"}>
										<button
											onClick={() => setShowNotifications(false)}
											className="absolute top-0 right-4 p-2 hover:bg-gray-100 rounded-lg"
											aria-label="Close"
										>
											<X className="h-5 w-5 text-gray-500" />
										</button>
										<h2 className="h-10 bg-[#F6F9FC] text-sm font-semibold text-[#474E5C] py-[0.625rem] px-4">Notification</h2>
										<div className="p-4">
											<div className="space-y-4 max-h-96 overflow-y-auto">
												{Object.entries(groupedNotifications).map(([dateGroup, groupNotifications]) => (
													<div key={dateGroup}>
														<h3 className="text-sm font-medium text-gray-500 mb-3 capitalize">{dateGroup}</h3>
														<div className="space-y-2">
															{groupNotifications.map((notification) => (
																<div
																	key={notification.id}
																	className={`flex items-start gap-3 p-3 h-14 rounded-lg cursor-pointer transition-colors ${notification.unread ? "bg-[#ECF4F1]" : "bg-[#FFFFFF]"
																		}`}
																	onClick={() => markAsRead(notification.id)}
																>
																	<div className="w-10 h-10 bg-[#448C74] rounded-full flex items-center  justify-center flex-shrink-0">
																		{getNotificationIcon(notification.type)}
																	</div>
																	<div className="flex-1 min-w-0">
																		<div className="flex items-center justify-between">
																			<h4 className="text-sm font-medium text-[#474E5C] truncate">
																				{notification.title}
																			</h4>
																			<span className="text-xs text-[#7E838D] ml-2 flex-shrink-0">
																				{notification.time}
																			</span>
																		</div>
																		<p
																			className="text-xs text-[#7E838D] mt-1 truncate"																	>
																			{notification.message}
																		</p>
																	</div>
																</div>
															))}
														</div>
													</div>
												))}
											</div>
										</div>
									</div>
								// </div>
							)}
						</div>

						{/* User Menu */}
						<div className="relative">
							<button
								onClick={handleUserMenuClick}
								className="flex items-center justify-between gap-2 p-1 bg-gray-100 rounded-[3rem] min-w-[5rem] h-[3rem]"
							>
								<div className="w-8 h-8 bg-[#448C74] rounded-full flex items-center justify-center text-white text-[0.788rem] md:text-[1.313rem] font-semibold">
									T
								</div>
								<ChevronDown className="size-6 text-gray-600" />
							</button>

							{isUserMenuOpen && (
								<div className="absolute right-0 mt-2 w-[18.75rem] py-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
									<div className="p-6 border-b border-gray-100">
										<div className="flex items-center gap-3">
											<div className="w-8 h-8 bg-[#448C74] rounded-full flex items-center justify-center text-white font-semibold text-[1.313rem]">
												T
											</div>
											<div>
												<p className="font-medium text-[#474E5C] text-sm">{user ? `${user.first_name} ${user.last_name}` : ""}</p>
												<p className="text-xs text-[#474E5C] font-normal">{user?.subscription_type ?? ""}</p>
											</div>
										</div>
									</div>
									<div className="p-2">
										<a
											href="/user/properties/listings"
											className="flex items-center gap-4 px-4 py-3 text-[#7E838D] hover:bg-gray-50 rounded-lg"
										>
											<Building2 className="w-5 h-5" />
											<span className="text-sm">My Properties</span>
										</a>
										<a
											href="/user/message"
											className="flex items-center gap-4 px-4 py-3 text-[#7E838D] hover:bg-gray-50 rounded-lg"
										>
											<Mail className="w-5 h-5 text-[#7E838D]" />
											<span className="text-sm">Inbox</span>
											<span className="ml-auto bg-[#448C74] text-white text-sm rounded-full w-6 h-6 flex items-center justify-center">
												3
											</span>
										</a>
										<a
											href="/user/account"
											className="flex items-center gap-4 px-4 py-3 text-[#7E838D] hover:bg-gray-50 rounded-lg"
										>
											<User className="w-5 h-5 text-[#7E838D]" />
											<span className="text-sm">Account</span>
										</a>
									</div>
									<div className="p-2 border-t border-gray-100">
										<a href="#" className="flex items-center gap-4 px-4 py-3 text-[#7E838D] hover:bg-gray-50">
											<HelpCircle className="w-5 h-5 text-[#7E838D]" />
											<span className="text-sm">About oversite</span>
										</a>
										<button
											onClick={logoutUserProfile}
											className="flex w-full cursor-pointer items-center gap-4 px-4 py-3 text-[#7E838D] hover:bg-gray-50 rounded-lg"
										>
											<LogOut className="w-5 h-5 text-[#7E838D]" />
											<span className="text-sm">Log out</span>
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</header>
		</>
	)
}
