"use client"

import { useState } from "react"
import {
	X,
	Bold,
	Italic,
	Underline,
	Type,
	Link,
	ImageIcon,
	List,
	ListOrdered,
	AlignLeft,
	RotateCcw,
	RotateCw,
	ChevronDown,
	ArrowLeft,
} from "lucide-react"

interface AddReviewModalProps {
	isOpen: boolean
	onClose: () => void
}

export default function AddReviewModal({ isOpen, onClose }: AddReviewModalProps) {
	const [reviewType, setReviewType] = useState("Expert Review")
	const [reviewContent, setReviewContent] = useState("")
	const [showMobileEditor, setShowMobileEditor] = useState(false)

	if (!isOpen) return null

	const handleProceed = () => {
		setShowMobileEditor(true)

	}
	const uploadReview = () => {
		handleUploadReview()
	}

	const handleUploadReview = () => {
		console.log("Uploading review:", { reviewType, reviewContent })
		onClose()
		setShowMobileEditor(false)
		setReviewContent("")
	}

	const handleCancel = () => {
		onClose()
		setShowMobileEditor(false)
		setReviewContent("")
	}

	const handleBackFromEditor = () => {
		setShowMobileEditor(false)
	}

	// Mobile Editor View (Full Screen)
	return (
		<div className="fixed inset-0 z-50 ">
			{showMobileEditor &&
				<div className="md:hidden block fixed inset-0 z-50 bg-white">
					{/* Mobile Editor Header */}
					<div className="flex items-center justify-between p-4 border-b border-gray-200">
						<button onClick={handleBackFromEditor} className="cursor-pointer flex items-center gap-2 text-gray-600">
							<ArrowLeft className="w-5 h-5" />
							<span>Back</span>
						</button>
						<h1 className="text-lg font-medium text-[#212A3B]">Expert Review</h1>
						<button
							onClick={handleUploadReview}
							className="cursor-pointer px-4 py-2 bg-[#448C74] text-white rounded-lg hover:bg-[#357a63] transition-colors"
						>
							Upload Review
						</button>
					</div>

					{/* Mobile Editor Content */}
					<div className="p-4">
						{/* Formatting Toolbar */}
						<div className="flex flex-wrap text-[#52525B] items-center gap-2 p-3 border border-gray-300 rounded-t-lg bg-gray-50">
							<button className="p-2 hover:bg-gray-200 rounded">
								<Bold className="w-4 h-4" />
							</button>
							<button className="p-2 hover:bg-gray-200 rounded">
								<Italic className="w-4 h-4" />
							</button>
							<button className="p-2 hover:bg-gray-200 rounded">
								<Underline className="w-4 h-4" />
							</button>
							<button className="p-2 hover:bg-gray-200 rounded">
								<Type className="w-4 h-4" />
							</button>
							<button className="p-2 hover:bg-gray-200 rounded">
								<Link className="w-4 h-4" />
							</button>
							<button className="p-2 hover:bg-gray-200 rounded">
								<ImageIcon className="w-4 h-4" />
							</button>
							<button className="p-2 hover:bg-gray-200 rounded">
								<List className="w-4 h-4" />
							</button>
							<button className="p-2 hover:bg-gray-200 rounded">
								<ListOrdered className="w-4 h-4" />
							</button>
							<button className="p-2 hover:bg-gray-200 rounded">
								<AlignLeft className="w-4 h-4" />
							</button>
							<button className="p-2 hover:bg-gray-200 rounded">
								<RotateCcw className="w-4 h-4" />
							</button>
							<button className="p-2 hover:bg-gray-200 rounded">
								<RotateCw className="w-4 h-4" />
							</button>
						</div>

						{/* Text Area */}
						<textarea
							value={reviewContent}
							onChange={(e) => setReviewContent(e.target.value)}
							placeholder="Enter text here.."
							className="w-full h-96 p-4 text-[#474E5C] border border-t-0 border-gray-300 rounded-b-lg focus:outline-none resize-none"
						/>
					</div>
				</div>}

			{!showMobileEditor && <div className="fixed inset-0 z-50 flex md:hidden items-center justify-center">
				{/* Backdrop */}
				<div className="absolute inset-0 bg-opacity-50 backdrop-blur-sm" onClick={handleCancel} />

				{/* Modal Content */}
				<div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
					{/* Header */}
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-[1.125rem] font-semibold text-[#212A3B]">Add a review</h2>
						<button onClick={handleCancel} className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
							<X className="w-5 h-5 text-gray-500" />
						</button>
					</div>

					{/* Subtitle */}
					<p className="text-[#474E5C] font-normal text-sm mb-6">Update the landowner about recent developments in this property.</p>

					{/* Review Type */}
					<div className="mb-8">
						<label className="block text-sm font-medium text-[#474E5C] mb-2">Review Type</label>
						<div className="relative">
							<select
								value={reviewType}
								onChange={(e) => setReviewType(e.target.value)}
								className="cursor-pointer w-full px-[0.875rem] py-[0.625rem] text-[#474E5C] h-[2.75rem] text-base font-normal border border-gray-300 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-[#448C74] focus:border-transparent"
							>
								<option value="Expert Review">Expert Review</option>
								<option value="Property Review">Property Review</option>
								<option value="Market Review">Market Review</option>
							</select>
							<ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex gap-3">
						<button
							onClick={handleCancel}
							className="cursor-pointer flex-1 px-4 py-3 h-[2.75rem] border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
						>
							Cancel
						</button>
						<button
							onClick={handleProceed}
							className="cursor-pointer flex-1 px-4 py-3 bg-[#448C74] h-[2.75rem] text-white rounded-lg hover:bg-[#357a63] transition-colors"
						>
							Proceed
						</button>
					</div>
				</div>
			</div>}

			<div className="hidden fixed inset-0 z-50 md:flex items-center justify-center">
				{/* Backdrop */}
				<div className="absolute inset-0 bg-opacity-50 backdrop-blur-sm" onClick={handleCancel} />

				{/* Modal Content */}
				<div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
					<div className="p-6">
						{/* Header */}
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-xl font-semibold text-[#212A3B]">Add a review</h2>
							<button onClick={handleCancel} className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
								<X className="w-5 h-5 text-gray-500" />
							</button>
						</div>

						{/* Subtitle */}
						<p className="text-gray-600 mb-6">Update the landowner about recent developments in this property.</p>

						{/* Review Type */}
						<div className="mb-6">
							<label className="block text-sm font-medium text-gray-700 mb-2">Review Type</label>
							<div className="relative">
								<select
									value={reviewType}
									onChange={(e) => setReviewType(e.target.value)}
									className="cursor-pointer  w-full px-[0.875rem] py-[0.625rem] h-[2.75rem] text-[#474E5C] border border-gray-300 rounded-lg appearance-none bg-white focus:outline-none"
								>
									<option value="Expert Review">Expert Review</option>
									<option value="Property Review">Property Review</option>
									<option value="Market Review">Market Review</option>
								</select>
								<ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
							</div>
						</div>

						{/* Rich Text Editor */}
						<div className="mb-6">
							{/* Formatting Toolbar */}
							<div className="flex flex-wrap text-[#52525B] items-center gap-1 p-3 border border-gray-300 rounded-t-lg bg-gray-50">
								<button className="p-2 hover:bg-gray-200 rounded">
									<Bold className="w-4 h-4 " />
								</button>
								<button className="p-2 hover:bg-gray-200 rounded">
									<Italic className="w-4 h-4" />
								</button>
								<button className="p-2 hover:bg-gray-200 rounded">
									<Underline className="w-4 h-4" />
								</button>
								<button className="p-2 hover:bg-gray-200 rounded">
									<Type className="w-4 h-4" />
								</button>
								<button className="p-2 hover:bg-gray-200 rounded">
									<Link className="w-4 h-4" />
								</button>
								<button className="p-2 hover:bg-gray-200 rounded">
									<ImageIcon className="w-4 h-4" />
								</button>
								<button className="p-2 hover:bg-gray-200 rounded">
									<List className="w-4 h-4" />
								</button>
								<button className="p-2 hover:bg-gray-200 rounded">
									<ListOrdered className="w-4 h-4" />
								</button>
								<button className="p-2 hover:bg-gray-200 rounded">
									<AlignLeft className="w-4 h-4" />
								</button>
								<div className="w-px h-6 bg-gray-300 mx-1" />
								<button className="p-2 hover:bg-gray-200 rounded">
									<RotateCcw className="w-4 h-4" />
								</button>
								<button className="p-2 hover:bg-gray-200 rounded">
									<RotateCw className="w-4 h-4" />
								</button>
							</div>

							{/* Text Area */}
							<textarea
								value={reviewContent}
								onChange={(e) => setReviewContent(e.target.value)}
								placeholder="Enter text here.."
								className="w-full h-64 p-4 text-[#474E5C] border border-t-0 border-gray-300 rounded-b-lg focus:outline-none resize-none"
							/>
						</div>

						{/* Action Buttons */}
						<div className="flex justify-end gap-3">
							<button
								onClick={handleCancel}
								className="cursor-pointer px-6 py-3 h-[2.75rem] border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={uploadReview}
								className="cursor-pointer px-6 py-3 h-[2.75rem] bg-[#448C74] text-white rounded-lg hover:bg-[#357a63] transition-colors"
							>
								Upload Review
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>

	)
}
