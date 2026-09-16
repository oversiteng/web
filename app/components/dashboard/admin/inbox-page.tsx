"use client"

import { useState } from "react"
import { BackNavButton } from "../../backNavButton"
import { Plus } from "lucide-react"

interface Message {
	id: string
	sender: string
	senderAvatar: string
	subject: string
	preview: string
	content: string
	timestamp: string
	fullTimestamp: string
	isRead: boolean
	signature?: string
}

interface MessageSystemProps {
	isMobile?: boolean
}

const mockMessages: Message[] = [
	{
		id: "1",
		sender: "Admin",
		senderAvatar: "Oversite Team",
		subject: "Welcome onboard",
		preview: "Welcome onboard, Oversite.ng is an innovate tool that optimizes your...",
		content: `Welcome onboard, Oversite.ng is an innovate tool that optimizes your experience with your personal or commercial properties by improving the effectiveness and ease of getting recent information about your property, wherever it may be located.

WE believe you are expecting value for your time and resource, so we as a team pledge to be available to render technical support when you need it.

Once again, Welcome!`,
		timestamp: "Jan 24, 6:50am",
		fullTimestamp: "Jan 24,2025, 6:50am",
		isRead: false,
		signature: `Igbinovia Israel
(Founder) Team Oversite NG`,
	},
	{
		id: "2",
		sender: "Admin",
		senderAvatar: "Oversite Team",
		subject: "Welcome onboard",
		preview: "Welcome onboard, Oversite.ng is an innovate tool that optimizes your...",
		content: `Welcome onboard, Oversite.ng is an innovate tool that optimizes your experience with your personal or commercial properties by improving the effectiveness and ease of getting recent information about your property, wherever it may be located.

WE believe you are expecting value for your time and resource, so we as a team pledge to be available to render technical support when you need it.

Once again, Welcome!`,
		timestamp: "Jan 24, 6:50am",
		fullTimestamp: "Jan 24,2025, 6:50am",
		isRead: false,
		signature: `Igbinovia Israel
(Founder) Team Oversite NG`,
	},
	{
		id: "3",
		sender: "Admin",
		senderAvatar: "Oversite Team",
		subject: "Welcome onboard",
		preview: "Welcome onboard, Oversite.ng is an innovate tool that optimizes your...",
		content: `Welcome onboard, Oversite.ng is an innovate tool that optimizes your experience with your personal or commercial properties by improving the effectiveness and ease of getting recent information about your property, wherever it may be located.

WE believe you are expecting value for your time and resource, so we as a team pledge to be available to render technical support when you need it.

Once again, Welcome!`,
		timestamp: "Jan 24, 6:50am",
		fullTimestamp: "Jan 24,2025, 6:50am",
		isRead: false,
		signature: `Igbinovia Israel
(Founder) Team Oversite NG`,
	},
]

export default function MessageSystem({ isMobile = false }: MessageSystemProps) {
	const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
	const [activeTab, setActiveTab] = useState<"all" | "draft">("all")

	const draftCount = mockMessages.filter((msg) => !msg.isRead).length
	const totalCount = mockMessages.length

	const handleMessageClick = (message: Message) => {
		setSelectedMessage(message)
	}

	const handleBackClick = () => {
		setSelectedMessage(null)
	}

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((word) => word[0])
			.join("")
			.toUpperCase()
	}

	// Single Message View
	if (selectedMessage) {
		return (
			<div className="min-h-screen bg-gray-50">
				<header className="py-4 px-2">
					<BackNavButton overRideAction={handleBackClick} />
				</header>

				{/* Message Content */}
				<div className="px-2">
					<div className="bg-white rounded-lg shadow-sm">
						<div className="p-6 flex flex-col gap-8">
							<div className="flex flex-col gap-4">
								{/* Message Header */}
								<div className="flex items-center gap-2">
									<div className="w-8 h-8 bg-[#448C74] rounded-full flex items-center justify-center text-white text-sm font-medium">
										{getInitials(selectedMessage.senderAvatar)}
									</div>
									<div className="flex-1">
										<div className="flex items-center gap-4 max-sm:justify-between">
											<h3 className="font-normal text-[#474E5C]">{selectedMessage.senderAvatar}</h3>
											<span className="font-normal text-sm text-[#474E5C]">{selectedMessage.fullTimestamp}</span>
										</div>
									</div>
								</div>

								{/* Subject */}
								<h1 className="md:text-[1.313rem] font-medium text-[#474E5C]">{selectedMessage.subject}</h1>
							</div>

							{/* Message Content */}
							<div className="prose max-w-none border-t border-[#E9EAEB] pt-8">
								<div className="text-[#474E5C] text-[1.125rem] font-normal leading-relaxed whitespace-pre-line mb-6">{selectedMessage.content}</div>

								{/* Signature */}
								{selectedMessage.signature && (
									<div className="text-[#474E5C] text-[1.125rem] italic font-normal whitespace-pre-line pt-4">
										{selectedMessage.signature}
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		)
	}

	// Message List View
	return (
		<div className="min-h-screen bg-gray-50">

			<div className="flex flex-col gap-4 bg-white rounded-lg">
				{/* Filter Tabs */}
				<div className="p-1 rounded-lg flex min-w-[18.125rem] items-center justify-between p- border-b">

					<div className="flex gap-4 border rounded-lg border-[#E9EAEB]">
						<button
							onClick={() => setActiveTab("all")}
							className={`cursor-pointer px-6 py-4 text-sm font-medium border transition-colors ${activeTab === "all"
								? "border-[#ECF4F1] shadow-md text-[#306251] bg-[#FFFFFF] rounded-[0.625rem]"
								: "border-transparent text-gray-500 hover:text-gray-700"
								}`}
						>
							All messages ({totalCount})
						</button>
						<button
							onClick={() => setActiveTab("draft")}
							className={`cursor-pointer px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === "draft"
								? "border-[#ECF4F1] shadow-md text-[#306251] bg-[#FFFFFF] rounded-[0.625rem]"
								: "border-transparent text-gray-500 hover:text-gray-700"
								}`}
						>
							draft ({draftCount}){draftCount > 0 && <div className="w-2 h-2 bg-[#448C74] rounded-full" />}
						</button>
					</div>
					<a
						href="message/compose"
						className="flex items-center gap-2 bg-[#448C74] hover:bg-[#448C7D] text-white  px-[1.125rem] py-[0.625rem] rounded-[0.5rem] font-medium transition-colors">
						<Plus className="w-4 h-4" />
						New Message
					</a>
				</div>

				{/* Message List */}
				<div className="bg-white rounded-2xl border border-[#E9EAEB] shadow-sm">
					<div className="divide-y divide-gray-100 flex flex-col gap-[1.125rem]">
						{mockMessages.map((message) => (
							<div
								key={message.id}
								onClick={() => handleMessageClick(message)}
								className="p-4 md:p-6 hover:bg-gray-50 cursor-pointer transition-colors"
							>
								<div className="grid grid-cols-12 gap-8 items-center">
									{/* Avatar */}
									<div className="md:col-span-2 col-span-2 flex items-center gap-2">
										<div className="w-10 h-10 bg-[#448C74] rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
											{getInitials(message.senderAvatar)}
										</div>
										<span className="hidden md:block text-base font-normal text-[#474E5C]">{message.sender}</span>
									</div>

									{/* Message Content */}
									<h3 className="w-full font-medium text-[#474E5C] md:text-base text-sm md:col-span-3 col-span-6 truncate">{message.subject}</h3>

									<span className="hidden md:block col-span-4 text-base font-normal text-[#474E5C] truncate">{message.preview}</span>


									<div className="md:col-span-3 col-span-4 text-right">
										<span className="text-base hidden md:block text-[#474E5C]">{message.fullTimestamp}</span>
										<span className="block md:hidden text-xs text-[#474E5C] ml-2 flex-shrink-0">{message.timestamp}</span>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}
