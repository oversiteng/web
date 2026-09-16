"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, Edit, Home, Star, FileText, MapPin, MessageSquare, Users, Shield, X, ChevronRight } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { BackNavButton } from "../../backNavButton"

interface PropertyDetailsProps {
	isMobile?: boolean
}

const actionButtons = [
	{ id: "material-cost", label: "Building Material Cost", icon: "Home" },
	{ id: "expert-review", label: "Expert Review", icon: "Star" },
	{ id: "policy-updates", label: "State Policy Updates", icon: "FileText" },
	{ id: "landmarks", label: "Landmarks", icon: "MapPin" },
	{ id: "word-on-street", label: "Word on the Street", icon: "MessageSquare" },
	{ id: "community-update", label: "Community update", icon: "Users" },
	{ id: "vulnerability-test", label: "Request Vulnerability Test", icon: "Shield" },
]

const getIcon = (iconName: string) => {
	switch (iconName) {
		case "Home":
			return <Home className="w-5 h-5 text-gray-600" />
		case "Star":
			return <Star className="w-5 h-5 text-gray-600" />
		case "FileText":
			return <FileText className="w-5 h-5 text-gray-600" />
		case "MapPin":
			return <MapPin className="w-5 h-5 text-gray-600" />
		case "MessageSquare":
			return <MessageSquare className="w-5 h-5 text-gray-600" />
		case "Users":
			return <Users className="w-5 h-5 text-gray-600" />
		case "Shield":
			return <Shield className="w-5 h-5 text-gray-600" />
		default:
			return <Home className="w-5 h-5 text-gray-600" />
	}
}

export default function PropertyValueDetails({ isMobile = false }: PropertyDetailsProps) {
	const {id:propertyId} =  useParams()
	const [featureOnDashboard, setFeatureOnDashboard] = useState(false)
	const router = useRouter()


	const handleActionClick = (actionId: string) => {
		router.push(`${actionId}`)
	}
	const [showImageModal, setShowImageModal] = useState(false)
	const [showModal, setShowModal] = useState(false)
	const [currentImageIndex, setCurrentImageIndex] = useState(0)

	const propertyImages = [
		"/prop-value-1.png",
		"/prop-value-3.jpg",
		"/prop-value-1.png",
		"/prop-value-3.jpg",
		"/prop-value-1.png",
		"/prop-value-3.jpg",
		"/prop-value-1.png",
		"/prop-value-3.jpg",
		"/prop-value-1.png",
	]

	const openImageModal = (index: number) => {
		setCurrentImageIndex(index)
		setShowImageModal(true)
	}

	const closeImageModal = () => {
		setShowImageModal(false)
	}

	const nextImage = () => {
		setCurrentImageIndex((prev) => (prev + 1) % propertyImages.length)
	}

	const prevImage = () => {
		setCurrentImageIndex((prev) => (prev - 1 + propertyImages.length) % propertyImages.length)
	}

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Escape") closeImageModal()
		if (e.key === "ArrowRight") nextImage()
		if (e.key === "ArrowLeft") prevImage()
	}

	const handleEditProperty = () => {
		router.push("/agent/properties/new-property")
	}

	const handleBackClick = () => {
		console.log("Back clicked")
	}


	// Added keyboard event listeners
	useEffect(() => {
		if (showImageModal) {
			document.addEventListener("keydown", handleKeyDown)
			document.body.style.overflow = "hidden"
		} else {
			document.body.style.overflow = "unset"
		}

		return () => {
			document.removeEventListener("keydown", handleKeyDown)
			document.body.style.overflow = "unset"
		}
	}, [showImageModal])


	if (isMobile) {
		return (
			<div className="min-h-screen bg-gray-50">

				{/* Breadcrumb */}
				<header className="px-4 md:px-6 py-4">
					<div className="flex flex-col md:flex-row md:items-center justify-between">
						<div className="flex items-center gap-4 mb-4 md:mb-0">
							<BackNavButton />
							<nav className="text-sm text-[#7E838D]">
								<span>My Properties</span>
								<span className="mx-2">/</span>
								<span className="max-w-[70px] truncate inline-block align-bottom" title="GreenLand Estate">
									GreenLand Estate
								</span>
								<span className="mx-2">/</span>
								<span className="max-w-[160px] truncate inline-block align-bottom text-[#212A3B]" title="Estimated Property Value" >Estimated Property Value.</span>
							</nav>
						</div>
					</div>
				</header>



				<div className="p-4 space-y-4">
					{/* Property Title */}
					<h1 className="text-[1.125rem] font-medium text-[#212A3B]">GreenLand Estate</h1>


					{/* Estimated Property Value */}
					<div className="rounded-lg shadow-sm money-card-wrapper bg-[#ECF4F1] h-[7.438rem]">
						<div className="p-6 money-card relative flex flex-col gap-6">
							<h2 className="text-sm font-normal text-[#474E5C]">Estimated Property Value</h2>
							<div className="text-[1.313rem] font-medium text-[#212A3B]">₦201,000,000</div>
						</div>
					</div>


					{/* Feature on Dashboard Toggle */}
					<div className="flex flex-col gap-4 py-6 px-4 rounded-2xl min-h-[10.25rem] border border-[#E9EAEB] bg-[#FFFFFF]">
						<label className="relative inline-flex gap-2 items-center cursor-pointer ">
							<input
								type="checkbox"
								checked={featureOnDashboard}
								onChange={(e) => setFeatureOnDashboard(e.target.checked)}
								className="sr-only peer"
							/>
							<div className="w-[2.25rem] h-5 bg-[#D0D5DD] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#448C74]"></div>
							<span className="text-sm font-normal text-[#212A3B]">Feature on Dashboard</span>
						</label>
						{/* Other Actions */}
						<div>
							<h3 className="text-sm font-medium text-[#474E5C] mb-3">Other actions</h3>

							<div
								className="md:flex grid grid-cols-2 gap-3 overflow-x-auto pb-2 overflow-y-scroll no-scrollbar no-scrollbar::-webkit-scrollbar"
							>
								{actionButtons.map((action) => (
									<button
										key={action.id}
										onClick={() => handleActionClick(action.id)}
										className="flex cursor-pointer items-center gap-2 px-4 py-3 border border-[#D0D5DD] rounded-lg hover:bg-gray-50 transition-colors text-left whitespace-nowrap flex-shrink-0"
									>
										{getIcon(action.icon)}
										<span className="text-sm text-[#212A3B] font-medium">{action.label}</span>
									</button>
								))}
							</div>


						</div>

					</div>


					{/* Property Image */}
					<div className="border border-[#D0D5DD] rounded-2xl bg-white">
						<div className="relative p-2">
							<div className="aspect-video rounded-lg overflow-hidden bg-[#D0D5DD]">
								<img
									src="/prop-value-1.png"
									alt="GreenLand Estate"
									className="w-full h-full object-cover"
								/>
							</div>
							<button
								onClick={handleEditProperty}
								className="absolute top-4 right-4 w-10 h-10 bg-[#448C74] text-white rounded-lg flex items-center justify-center hover:bg-[#357a63] transition-colors"
							>
								<Edit className="w-5 h-5" />
							</button>
						</div>

						{/* Property Details */}
						<div className="py-4 pt-2 px-4 flex flex-col gap-4">
							{/* Property Name */}
							<div className="flex flex-col gap-2">
								<p className="text-sm text-[#7E838D]">Property Name</p>
								<p className="font-medium text-sm text-[#474E5C]">GreenLand Estate</p>
							</div>

							{/* Type and Land Size */}
							<div className="grid grid-cols-2 gap-4">
								<div className="flex flex-col gap-2">
									<p className="text-sm text-[#7E838D]">Type</p>
									<p className="text-sm font-medium text-[#474E5C]">GreenLand Estate</p>
								</div>
								<div className="flex flex-col gap-2">
									<p className="text-sm text-[#7E838D]">Land Size</p>
									<p className="text-sm font-medium text-[#474E5C]">2,5677 sqm</p>
								</div>
							</div>

							{/* Year Built/Purchased */}
							<div className="flex flex-col gap-2">
								<p className="text-sm text-[#7E838D]">Year Built/Purchased</p>
								<p className="text-sm font-medium text-[#212A3B]">2024</p>
							</div>

							{/* Property Address */}
							<div className="flex flex-col gap-2">
								<p className="text-sm text-[#7E838D]">Property Address</p>
								<p className="font-medium text-[#212A3B]">GreenLand Estate</p>
							</div>

							{/* Estimated Value Cost */}
							<div className="flex flex-col gap-2">
								<p className="text-sm text-[#7E838D]">Estimated Value Cost</p>
								<p className="text-sm font-medium text-[#212A3B]">₦201,000,000</p>
							</div>

							{/* Property Acquisition Cost */}
							<div className="flex flex-col gap-2">
								<p className="text-sm text-[#7E838D]">Property Acquisition Cost</p>
								<p className="text-sm font-medium text-[#212A3B]">₦10,000,000</p>
							</div>

							{/* Property Documentation Cost */}
							<div className="flex flex-col gap-2">
								<p className="text-sm text-[#7E838D]">Property Documentation Cost</p>
								<p className="text-sm font-medium text-[#212A3B]">₦10,000</p>
							</div>

							{/* Details */}
							<div>
								<p className="text-sm text-[#7E838D] mb-2">Details</p>
								<p className="text-sm text-[#212A3B] font-medium">
									Lorem ipsum dolor sit amet consectetur. Volutpat quisque ornare euismod libero.
								</p>
							</div>

							{/* Additional Information */}
							<div>
								<p className="text-sm text-[#7E838D] mb-2">Additional Information</p>
								<p className="text-sm text-[#212A3B] font-medium">
									Lorem ipsum dolor sit amet consectetur. Volutpat quisque ornare euismod libero. Sapien suspendisse
									auctor nunc vulputate tempus ipsum. Erat proin tellus purus euismod pharetra quisque pretium sit.
								</p>
							</div>

							{/* Listing Images */}
							<div className="p-2 pb-4 flex flex-col gap-4">
								<p className="text-base font-medium text-[#474E5C]">Listing Images</p>
								<div className="grid grid-cols-3 gap-2">
									<div className="aspect-square rounded-lg overflow-hidden bg-[#D0D5DD]" onClick={() => openImageModal(0)}>
										<img
											src={propertyImages[0] || "/prop-value-2.png"}
											alt="Property image 1"
											className="w-full h-full object-cover"
										/>
									</div>
									<div className="aspect-square rounded-lg overflow-hidden bg-[#D0D5DD]" onClick={() => openImageModal(1)}>
										<img
											src={propertyImages[1] || "/prop-value-3.png"}
											alt="Property image 2"
											className="w-full h-full object-cover"
										/>
									</div>
									<div className="aspect-square rounded-lg overflow-hidden relative bg-[#D0D5DD]" onClick={() => openImageModal(2)}>
										<img
											src={propertyImages[2] || "/prop-value-3.jpg"}
											alt="Property image 3"
											className="w-full h-full object-cover"
										/>
										<div className="absolute inset-0 bg-[#00000080]  flex items-center justify-center">
											<span className="text-white text-xs font-medium">+6 more images</span>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Property Manager */}
					</div>
					<div className="bg-white rounded-2xl shadow-lg shadow-[#1E1E1E05] border border-[#E9EAEB] p-6">
						<div className="flex items-center gap-6">
							<div className="w-16 h-16 rounded-full overflow-hidden bg-[#D0D5DD]">
								<img
									src="/prop-value-profile-img.jpg"
									alt="Jessica Akinola"
									className="w-full h-full object-cover"
								/>
							</div>
							<div className="flex flex-col gap-2">
								<p className="text-sm text-[#7E838D] font-normal">Property Manager</p>
								<h4 className="text-base font-medium text-[#474E5C]">Jessica Akinola</h4>
							</div>
						</div>
					</div>
				</div>
				{/* Image Gallery Modal */}
				{showImageModal && (
					<div className="fixed inset-0 z-50 flex items-center justify-center">
						{/* Backdrop */}
						<div className="absolute inset-0 bg-black bg-opacity-75 backdrop-blur-sm" onClick={closeImageModal} />

						{/* Modal Content */}
						<div className="relative w-full h-full flex items-center justify-center p-4">
							{/* Close Button */}
							<button
								onClick={closeImageModal}
								className="absolute top-4 right-4 z-10 w-10 h-10 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
							>
								<X className="w-5 h-5 text-gray-600" />
							</button>

							{/* Main Image */}
							<div className="relative max-w-4xl max-h-full">
								<img
									src={propertyImages[currentImageIndex] || "/placeholder.svg"}
									alt={`Property image ${currentImageIndex + 1}`}
									className="max-w-full max-h-full object-contain rounded-lg"
								/>
							</div>

							{/* Navigation Buttons */}
							<div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4">
								<button
									onClick={prevImage}
									className="w-12 h-12 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors shadow-lg"
								>
									<ChevronLeft className="w-6 h-6 text-gray-600" />
								</button>
								<button
									onClick={nextImage}
									className="w-12 h-12 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors shadow-lg"
								>
									<ChevronRight className="w-6 h-6 text-gray-600" />
								</button>
							</div>

							{/* Image Counter */}
							<div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
								{currentImageIndex + 1} / {propertyImages.length}
							</div>
						</div>
					</div>
				)}
			
			</div>
		)
	}

	// Desktop Layout (unchanged from previous version)
	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="px-4 md:px-6 py-4">
				<div className="flex items-center justify-between">
					<div className="flex flex-col md:flex-row md:items-center justify-between">
						<div className="flex items-center gap-4 mb-4 md:mb-0">
													<BackNavButton />
							<nav className="text-sm text-[#7E838D]">

								<span>My Properties</span>
								<span className="mx-2">/</span>
								<span className="max-w-[70px] truncate inline-block align-bottom" title="GreenLand Estate">
									GreenLand Estate
								</span>
								<span className="mx-2">/</span>
								<span className="truncate inline-block align-bottom text-[#212A3B]" title="Estimated Property Value" >Estimated Property Value.</span>
							</nav>
						</div>
					</div>
					<button
						onClick={handleEditProperty}
						className="flex items-center gap-2 px-4 py-2 bg-[#448C74] text-white rounded-lg hover:bg-[#448C74] transition-colors cursor-pointer"
					>
						<Edit className="w-4 h-4" />
						Edit property
					</button>
				</div>
			</header>



			<div className="max-w-7xl mx-auto p-4 md:p-6">
				<div className="grid gap-6 grid-cols-5">
					{/* Left Column - Property Actions */}
					<div className="col-span-2 flex	flex-col gap-6">
						{/* Property Title */}
						<h1 className="text-[1.75rem] font-medium text-[#212A3B]">GreenLand Estate</h1>

						{/* Estimated Property Value */}
						<div className="rounded-lg shadow-sm money-card-wrapper bg-[#ECF4F1] h-[8.75rem]">
							<div className="p-6 money-card relative flex flex-col gap-6">
								<h2 className="text-base font-normal text-[#474E5C]">Estimated Property Value</h2>
								<div className="text-[1.75rem] font-medium text-[#212A3B]">₦201,000,000</div>
							</div>
						</div>


						{/* Feature on Dashboard Toggle */}
						<div className="bg-white rounded-lg shadow-sm p-6 flex	flex-col gap-6">
							<div className="flex items-center gap-3">
								<label className="relative inline-flex gap-2 items-center cursor-pointer ">
									<input
										type="checkbox"
										checked={featureOnDashboard}
										onChange={(e) => setFeatureOnDashboard(e.target.checked)}
										className="sr-only peer"
									/>
									<div className="w-[2.25rem] h-5 bg-[#D0D5DD] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#448C74]"></div>
									<span className="text-sm font-normal text-[#212A3B]">Feature on Dashboard</span>
								</label>
							</div>
							<h3 className="text-base font-medium text-[#474E5C] mb-4">Other actions</h3>
							{/* <div className="grid grid-cols-2 gap-4"> */}
							<div className="flex flex-wrap gap-4">
								{actionButtons.map((action) => (
									<button
										key={action.id}
										onClick={() => handleActionClick(action.id)}
										className="flex items-center cursor-pointer gap-3 p-3 border min-w-max border-[#D0D5DD] rounded-lg hover:bg-gray-50 transition-colors text-left"
									>
										{getIcon(action.icon)}
										<span className="text-sm text-[#212A3B] font-medium">{action.label}</span>
									</button>
								))}
							</div>
						</div>

						{/* Property Manager */}
						<div className="bg-white rounded-2xl border border-[#E9EAEB] py-8 px-6 shadow-sm  shadow-[#1E1E1E05] p-6 min-h-[12rem]">
							<div className="flex items-center gap-6">
								<div className="w-32 h-32 rounded-full overflow-hidden bg-[#D0D5DD]">
									<img
										src="/prop-value-profile-img.jpg"
										alt="Jessica Akinola"
										className="w-full h-full object-cover"
									/>
								</div>
								<div className="flex flex-col gap-2">
									<p className="text-sm text-[#7E838D] font-normal">Property Manager</p>
									<h4 className="text-base font-medium text-[#474E5C]">Jessica Akinola</h4>
								</div>
							</div>
						</div>
					</div>

					{/* Right Column - Property Details */}
					<div className="col-span-3 space-y-6 border border-[#D0D5DD] rounded-2xl ">
						{/* Property Image */}
						<div className="overflow-hidden rounded-2xl">
							<div className="">
								<div className="aspect-video h-[10.5rem] w-full p-[0.625rem] rounded-2xl">
									<img
										src="/prop-value-banner.png"
										alt="GreenLand Estate"
										className="w-full h-full object-cover rounded-2xl"
									/>
								</div>
								<div className="p-6 pt-4 flex flex-col gap-6">
									{/* Property Name */}
									<div className="flex flex-col gap-2">
										<p className="text-sm text-[#7E838D]">Property Name</p>
										<p className="font-medium text-[#212A3B]">GreenLand Estate</p>
									</div>

									{/* Property Details Grid */}
									<div className="grid grid-cols-3 gap-4">
										<div className="flex flex-col gap-2">
											<p className="text-sm text-[#7E838D]">Type</p>
											<p className="text-sm font-medium text-[#212A3B]">GreenLand Estate</p>
										</div>
										<div className="flex flex-col gap-2">
											<p className="text-sm text-[#7E838D]">Land Size</p>
											<p className="text-sm font-medium text-[#212A3B]">2,5677 sqm</p>
										</div>
										<div className="flex flex-col gap-2">
											<p className="text-sm text-[#7E838D]">Year Built/Purchased</p>
											<p className="text-sm font-medium text-[#212A3B]">2024</p>
										</div>
									</div>

									{/* Property Address */}
									<div className="flex flex-col gap-2">
										<p className="text-sm text-[#7E838D]">Property Address</p>
										<p className="font-medium text-[#212A3B]">GreenLand Estate</p>
									</div>

									{/* Cost Breakdown */}
									<div className="grid grid-cols-3 gap-4">
										<div className="flex flex-col gap-2">
											<p className="text-sm text-[#7E838D]">Estimated Value Cost</p>
											<p className="text-sm font-medium text-[#212A3B]">₦201,000,000</p>
										</div>
										<div className="flex flex-col gap-2">
											<p className="text-sm text-[#7E838D]">Property Acquisition Cost</p>
											<p className="text-sm font-medium text-[#212A3B]">₦10,000,000</p>
										</div>
										<div className="flex flex-col gap-2">
											<p className="text-sm text-[#7E838D]">Property Documentation Cost</p>
											<p className="text-sm font-medium text-[#212A3B]">₦10,000</p>
										</div>
									</div>

									{/* Details */}
									<div>
										<p className="text-sm text-[#7E838D] mb-2">Details</p>
										<p className="text-sm text-[#212A3B] font-medium">
											Lorem ipsum dolor sit amet consectetur. Volutpat quisque ornare euismod libero.
										</p>
									</div>

									{/* Additional Information */}
									<div>
										<p className="text-sm text-[#7E838D] mb-2">Additional Information</p>
										<p className="text-sm text-[#212A3B] font-medium">
											Lorem ipsum dolor sit amet consectetur. Volutpat quisque ornare euismod libero. Sapien suspendisse
											auctor nunc vulputate tempus ipsum. Erat proin tellus purus euismod pharetra quisque pretium sit.
										</p>
									</div>
								</div>

							</div>
							{/* Listing Images */}
							<div className="flex flex-col gap-4	p-6">
								<p className="text-base font-medium text-[#474E5C] mb-3">Listing Images</p>
								<div className="grid grid-cols-3 gap-2">
									<div className="aspect-square rounded-lg overflow-hidden bg-[#D0D5DD]" onClick={() => openImageModal(0)}
									>
										<img
											src={propertyImages[0] || "/prop-value-1.png"}
											alt="Property image 1"
											className="w-full h-full object-cover"
										/>
									</div>
									<div className="aspect-square rounded-lg overflow-hidden bg-[#D0D5DD]" onClick={() => openImageModal(1)}>
										<img
											src={propertyImages[1] || "/prop-value-3.png"}
											alt="Property image 2"
											className="w-full h-full object-cover"
										/>
									</div>
									<div className="aspect-square rounded-lg overflow-hidden relative bg-[#D0D5DD]" onClick={() => openImageModal(3)}>
										<img
											src={propertyImages[2] || "/prop-value-3.jpg"}
											alt="Property image 3"
											className="w-full h-full object-cover"
										/>
										<div className="absolute inset-0 bg-[#00000080] flex items-center justify-center">
											<span className="text-white text-sm font-medium">+6 more images</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			{showImageModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center">
					{/* Backdrop */}
					<div className="absolute inset-0 bg-black opacity-75 backdrop-blur-sm" onClick={closeImageModal} />

					{/* Modal Content */}
					<div className="relative w-full h-full flex items-center justify-center p-4">
						{/* Close Button */}
						<button
							onClick={closeImageModal}
							className="absolute top-4 right-4 z-10 w-10 h-10 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
						>
							<X className="w-5 h-5 text-gray-600" />
						</button>

						{/* Main Image */}
						<div className="relative max-w-4xl max-h-full">
							<img
								src={propertyImages[currentImageIndex] || "/placeholder.svg"}
								alt={`Property image ${currentImageIndex + 1}`}
								className="max-w-full max-h-full object-contain rounded-lg"
							/>
						</div>

						{/* Navigation Buttons */}
						<div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4">
							<button
								onClick={prevImage}
								className="w-12 h-12 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors shadow-lg"
							>
								<ChevronLeft className="w-6 h-6 text-gray-600" />
							</button>
							<button
								onClick={nextImage}
								className="w-12 h-12 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors shadow-lg"
							>
								<ChevronRight className="w-6 h-6 text-gray-600" />
							</button>
						</div>

						{/* Image Counter */}
						<div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
							{currentImageIndex + 1} / {propertyImages.length}
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
