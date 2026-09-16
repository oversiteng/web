"use client"

import { useState } from "react"
import { ArrowLeft, ChevronDown } from "lucide-react"
import type { Recipient } from "@/libs/interface"
import { Sidebar } from "@/app/components/dashboard/admin/sidebar"
import { useLayoutContext } from "@/app/ProviderLayout"
import { Header } from "@/app/components/dashboard/header"
import { RecipientSelector } from "@/app/components/dashboard/admin/messaging/recipient-selector"
import { RichTextEditor } from "@/app/components/dashboard/admin/messaging/rich-text-editor"
import { SaveDraftModal } from "@/app/components/dashboard/admin/messaging/save-draft-modal"
import { ScheduleModal } from "@/app/components/dashboard/admin/messaging/schedule-modal"
import { BackNavButton } from "@/app/components/backNavButton"

export default function Page() {
	const [subject, setSubject] = useState("")
	const [content, setContent] = useState("")
	const [recipients, setRecipients] = useState<Recipient[]>([])
	const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
	const [showSendOptions, setShowSendOptions] = useState(false)
	const [isSaveDraftModalOpen, setIsSaveDraftModalOpen] = useState(false)
	const { user } = useLayoutContext()
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

	const handleSendNow = () => {
		console.log("Sending message now:", { subject, content, recipients })
		// Handle immediate send
	}

	const handleSchedule = (date: Date) => {
		console.log("Scheduling message for:", date, { subject, content, recipients })
		// Handle scheduled send
	}

	const handleSendLater = () => {
		setIsScheduleModalOpen(true)
		setShowSendOptions(false)
	}

	const handleSaveDraft = () => {
		console.log("Saving draft:", { subject, content, recipients })
		setIsSaveDraftModalOpen(false)
		// Handle draft save logic
	}

	const handleBeforeUnload = () => {
		if (subject.trim() || content.trim() || recipients.length > 0) {
			setIsSaveDraftModalOpen(true)
		}
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

				<main className="flex-1 overflow-auto p-4 lg:p-4">
					<header className="py-4 px-2">
						<BackNavButton />
					</header>
					<div className="bg-white rounded-lg shadow-sm border p-6">
						<h1 className="text-xl font-semibold mb-6">Send a message</h1>

						<div className="space-y-6">
							{/* Subject */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
								<input
									type="text"
									value={subject}
									onChange={(e) => setSubject(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
									placeholder="Enter message subject"
								/>
							</div>

							{/* Recipients */}
							<RecipientSelector selectedRecipients={recipients} onRecipientsChange={setRecipients} />

							{/* Rich Text Editor */}
							<div>
								<RichTextEditor value={content} onChange={setContent} placeholder="Start typing..." />
							</div>

							{/* Action Buttons */}
							<div className="flex justify-end gap-3">
								{/* Desktop Buttons */}
								<div className="hidden sm:flex gap-3">
									<button
										type="button"
										onClick={() => setIsSaveDraftModalOpen(true)}
										className="px-6 py-2 border border-gray-300 rounded-lg bg-red-500 text-white cursor-pointer font-medium"
									>
										Save Draft
									</button>
									<button
										type="button"
										onClick={handleSendLater}
										className="px-6 py-2 bg-[#ECF4F1] border border-gray-300 text-[#306251] cursor-pointer rounded-lg hover:bg-gray-50 font-medium"
									>
										Send later
									</button>
									<button
										type="button"
										onClick={handleSendNow}
										className="px-6 py-2 bg-[#448C74] hover:bg-[#448C7E] text-white cursor-pointer rounded-lg font-medium"
									>
										Send Message
									</button>
								</div>

								{/* Mobile Dropdown Button */}
								<div className="sm:hidden relative">
									<button
										type="button"
										onClick={() => setShowSendOptions(!showSendOptions)}
										className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
									>
										Send Message
										<ChevronDown className="w-4 h-4" />
									</button>

									{showSendOptions && (
										<div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[150px]">
											<button
												type="button"
												onClick={() => {
													handleSendNow()
													setShowSendOptions(false)
												}}
												className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-t-lg"
											>
												Send Now
											</button>
											<button
												type="button"
												onClick={handleSendLater}
												className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-b-lg"
											>
												Schedule Send
											</button>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>

					<SaveDraftModal
						isOpen={isSaveDraftModalOpen}
						onCancel={() => setIsSaveDraftModalOpen(false)}
						onContinue={handleSaveDraft}
					/>
				</main>
			</div>

			<ScheduleModal
				isOpen={isScheduleModalOpen}
				onClose={() => setIsScheduleModalOpen(false)}
				onSchedule={handleSchedule}
			/>
		</div>
	)
}
