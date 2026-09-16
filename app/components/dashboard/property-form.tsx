"use client"

import { useState } from "react"
import { ChevronDown, Search, Upload, X, Trash2 } from "lucide-react"

interface AmenityOption {
	id: string
	label: string
}

interface UploadedImage {
	id: string
	url: string
	file?: File
}

export function PropertyForm() {
	const [customAmenity, setCustomAmenity] = useState("")
	const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
		"security-system",
		"heating-system",
		"elevator",
		"parking-lot",
		"gym-facilities",
		"lounge-area",
		"roof-garden",
		"conference-room",
		"cafeteria",
		"swimming-pool",
	])
	const [isAmenitiesOpen, setIsAmenitiesOpen] = useState(false)
	const [customAmenities, setCustomAmenities] = useState<string[]>([])
	const [propertyImages, setPropertyImages] = useState<UploadedImage[]>([
		{
			id: "1",
			url: "/uploaded1.png",
		},
		{
			id: "2",
			url: "/uploaded1.png",
		},
	])
	const [bannerImage, setBannerImage] = useState<UploadedImage | null>({
		id: "banner-1",
			url: "/ads1.png",
	})

	const amenityOptions: AmenityOption[] = [
		{ id: "air-conditioning", label: "Air conditioning" },
		{ id: "heating-system", label: "Heating system" },
		{ id: "wifi-connection", label: "Wi-Fi connection" },
		{ id: "fully-equipped-kitchen", label: "Fully equipped kitchen" },
		{ id: "private-balcony", label: "Private balcony" },
		{ id: "en-suite-bathroom", label: "En-suite bathroom" },
		{ id: "smart-locks", label: "Smart locks" },
		{ id: "bbq-area", label: "BBQ area" },
		{ id: "smart-home", label: "Smart home" },
		{ id: "ocean-view", label: "Ocean view" },
		{ id: "security-system", label: "Security system" },
		{ id: "video-surveillance", label: "Video surveillance" },
		{ id: "elevator", label: "Elevator" },
		{ id: "parking-lot", label: "Parking lot" },
		{ id: "gym-facilities", label: "Gym facilities" },
		{ id: "lounge-area", label: "Lounge area" },
		{ id: "roof-garden", label: "Roof garden" },
		{ id: "conference-room", label: "Conference room" },
		{ id: "cafeteria", label: "Cafeteria" },
		{ id: "swimming-pool", label: "Swimming pool" },
	]

	const handleAmenityToggle = (id: string) => {
		setSelectedAmenities((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
	}

	const handleRemoveAmenity = (id: string) => {
		setSelectedAmenities((prev) => prev.filter((item) => item !== id))
	}

	const handleAddCustomAmenity = () => {
		if (customAmenity.trim() !== "") {
			setCustomAmenities((prev) => [...prev, customAmenity.trim()])
			setCustomAmenity("")
		}
	}

	const handleRemoveCustomAmenity = (index: number) => {
		setCustomAmenities((prev) => prev.filter((_, i) => i !== index))
	}

	const handleImageUpload = (files: FileList | null, type: "property" | "banner") => {
		if (!files) return

		Array.from(files).forEach((file) => {
			const reader = new FileReader()
			reader.onload = (e) => {
				const newImage: UploadedImage = {
					id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
					url: e.target?.result as string,
					file,
				}

				if (type === "property") {
					setPropertyImages((prev) => [...prev, newImage])
				} else {
					setBannerImage(newImage)
				}
			}
			reader.readAsDataURL(file)
		})
	}

	const handleRemovePropertyImage = (id: string) => {
		setPropertyImages((prev) => prev.filter((img) => img.id !== id))
	}

	const handleRemoveBannerImage = () => {
		setBannerImage(null)
	}

	return (
		<div className="bg-white p-6 rounded-lg">
			<h1 className="text-lg font-semibold text-[#212A3B] mb-2">Property Details</h1>
			<p className="text-[#474E5C] text-sm font-normal mb-6">
				Please provide the property details along with any other essential information.
			</p>

			<form className="space-y-6">
				{/* Property Name */}
				<div>
					<label htmlFor="property-name" className="block text-sm font-medium text-[#474E5C] mb-[0.375rem]">
						Property Name
					</label>
					<input
						type="text"
						id="property-name"
						className="w-full h-[2.75rem] px-[0.875rem] text-black placeholder:text-[#A4A8AF] disabled:text-[#A4A8AF] text-base py-2 border border-[#D0D5DD] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
					/>
					<p className="text-[#FC3B3B] text-sm italic font-normal mt-1">Please note: Property name cannot be changed once created</p>
				</div>

				{/* Land Size and Building Type */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label htmlFor="land-size" className="block text-sm font-medium text-[#474E5C] mb-[0.375rem]">
							Land Size (in sq meters)
						</label>
						<input
							type="number"
							id="land-size"
							className="w-full h-[2.75rem] px-[0.875rem] text-black placeholder:text-[#A4A8AF] disabled:text-[#A4A8AF] text-base py-2 border border-[#D0D5DD] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
						/>
					</div>
					<div>
						<label htmlFor="building-type" className="block text-sm font-medium text-[#474E5C] mb-[0.375rem]">
							Building Type
						</label>
						<div className="relative">
							<select
								id="building-type"
								className="w-full h-[2.75rem] px-[0.875rem] text-black placeholder:text-[#A4A8AF] disabled:text-[#A4A8AF] text-base py-2 border border-[#D0D5DD] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
							>
								<option value="" disabled >Select Building Type</option>
								<option value="apartment">Apartment</option>
								<option value="house">House</option>
								<option value="condo">Condo</option>
								<option value="townhouse">Townhouse</option>
								<option value="land">Land</option>
								<option value="commercial">Commercial</option>
							</select>
							<ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
						</div>
					</div>
				</div>

				{/* Room, Bathroom, Year Built */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div>
						<label htmlFor="room" className="block text-sm font-medium text-[#474E5C] mb-[0.375rem]">
							Room
						</label>
						<div className="relative">
							<select
								id="room"
								className="w-full h-[2.75rem] px-[0.875rem] text-black placeholder:text-[#A4A8AF] disabled:text-[#A4A8AF] text-base py-2 border border-[#D0D5DD] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
							>
								<option value="" disabled>Number of Room</option>
								{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
									<option key={num} value={num}>
										{num}
									</option>
								))}
							</select>
							<ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
						</div>
					</div>
					<div>
						<label htmlFor="bathroom" className="block text-sm font-medium text-[#474E5C] mb-[0.375rem]">
							Bathroom
						</label>
						<div className="relative">
							<select
								id="bathroom"
								className="w-full h-[2.75rem] px-[0.875rem] text-black placeholder:text-[#A4A8AF] disabled:text-[#A4A8AF] text-base py-2 border border-[#D0D5DD] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
							>
								<option value="" disabled>Number of Bathroom</option>
								{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
									<option key={num} value={num}>
										{num}
									</option>
								))}
							</select>
							<ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
						</div>
					</div>
					<div>
						<label htmlFor="year-built" className="block text-sm font-medium text-[#474E5C] mb-[0.375rem]">
							Year Built
						</label>
						<div className="relative">
							<select
								id="year-built"
								className="w-full h-[2.75rem] px-[0.875rem] text-black placeholder:text-[#A4A8AF] disabled:text-[#A4A8AF] text-base py-2 border border-[#D0D5DD] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
							>
								<option value="" disabled>Year Built</option>
								{Array.from({ length: 74 }, (_, i) => new Date().getFullYear() - i).map((year) => (
									<option key={year} value={year}>
										{year}
									</option>
								))}
							</select>
							<ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
						</div>
					</div>
				</div>

				{/* Property Costs */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div>
						<label htmlFor="acquisition-cost" className="block text-sm font-medium text-[#474E5C] mb-[0.375rem]">
							Property Acquisition Cost
						</label>
						<input
							type="number"
							id="acquisition-cost"
							className="w-full h-[2.75rem] px-[0.875rem] text-black placeholder:text-[#A4A8AF] disabled:text-[#A4A8AF] text-base py-2 border border-[#D0D5DD] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
						/>
					</div>
					<div>
						<label htmlFor="value-cost" className="block text-sm font-medium text-[#474E5C] mb-[0.375rem]">
							Estimated Value Cost
						</label>
						<input
							type="number"
							id="value-cost"
							className="w-full h-[2.75rem] px-[0.875rem] text-black placeholder:text-[#A4A8AF] disabled:text-[#A4A8AF] text-base py-2 border border-[#D0D5DD] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
						/>
					</div>
					<div>
						<label htmlFor="documentation-cost" className="block text-sm font-medium text-[#474E5C] mb-[0.375rem]">
							Property Documentation Cost
						</label>
						<input
							type="number"
							id="documentation-cost"
							className="w-full h-[2.75rem] px-[0.875rem] text-black placeholder:text-[#A4A8AF] disabled:text-[#A4A8AF] text-base py-2 border border-[#D0D5DD] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
						/>
					</div>
				</div>

				{/* Address */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label htmlFor="address-1" className="block text-sm font-medium text-[#474E5C] mb-[0.375rem]">
							Address 1
						</label>
						<input
							type="text"
							id="address-1"
							className="w-full h-[2.75rem] px-[0.875rem] text-black placeholder:text-[#A4A8AF] disabled:text-[#A4A8AF] text-base py-2 border border-[#D0D5DD] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
						/>
					</div>
					<div>
						<label htmlFor="address-2" className="block text-sm font-medium text-[#474E5C] mb-[0.375rem]">
							Address 2
						</label>
						<input
							type="text"
							id="address-2"
							className="w-full h-[2.75rem] px-[0.875rem] text-black placeholder:text-[#A4A8AF] disabled:text-[#A4A8AF] text-base py-2 border border-[#D0D5DD] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
						/>
					</div>
				</div>

				{/* Location Details */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div>
						<label htmlFor="bus-stop" className="block text-sm font-medium text-[#474E5C] mb-[0.375rem]">
							Bus Stop
						</label>
						<input
							type="text"
							id="bus-stop"
							className="w-full h-[2.75rem] px-[0.875rem] text-black placeholder:text-[#A4A8AF] disabled:text-[#A4A8AF] text-base py-2 border border-[#D0D5DD] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
						/>
					</div>
					<div>
						<label htmlFor="city" className="block text-sm font-medium text-[#474E5C] mb-[0.375rem]">
							City
						</label>
						<input
							type="text"
							id="city"
							className="w-full h-[2.75rem] px-[0.875rem] text-black placeholder:text-[#A4A8AF] disabled:text-[#A4A8AF] text-base py-2 border border-[#D0D5DD] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
						/>
					</div>
					<div>
						<label htmlFor="postcode" className="block text-sm font-medium text-[#474E5C] mb-[0.375rem]">
							Postcode
						</label>
						<input
							type="text"
							id="postcode"
							className="w-full h-[2.75rem] px-[0.875rem] text-black placeholder:text-[#A4A8AF] disabled:text-[#A4A8AF] text-base py-2 border border-[#D0D5DD] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
						/>
					</div>
				</div>

				{/* State and LGA */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div>
						<label htmlFor="state" className="block text-sm font-medium text-[#474E5C] mb-[0.375rem]">
							State
						</label>
						<div className="relative">
							<select
								id="state"
								className="w-full h-[2.75rem] px-[0.875rem] text-black placeholder:text-[#A4A8AF] disabled:text-[#A4A8AF] text-base py-2 border border-[#D0D5DD] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
							>
								<option value="" disabled>Select State</option>
								<option value="lagos">Lagos</option>
								<option value="abuja">Abuja</option>
								<option value="rivers">Rivers</option>
								<option value="kano">Kano</option>
							</select>
							<ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
						</div>
					</div>
					<div>
						<label htmlFor="lga" className="block text-sm font-medium text-[#474E5C] mb-[0.375rem]">
							Local Government Area (LGA)
						</label>
						<div className="relative">
							<select
								id="lga"
								className="w-full h-[2.75rem] px-[0.875rem] text-black placeholder:text-[#A4A8AF] disabled:text-[#A4A8AF] text-base py-2 border border-[#D0D5DD] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
							>
								<option value="" disabled>Select LGA</option>
								<option value="ikeja">Ikeja</option>
								<option value="lekki">Lekki</option>
								<option value="surulere">Surulere</option>
							</select>
							<ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
						</div>
					</div>
					<div>
						<label htmlFor="landmark" className="block text-sm font-medium text-[#474E5C] mb-[0.375rem]">
							Landmark
						</label>
						<input
							type="text"
							id="landmark"
							className="w-full h-[2.75rem] px-[0.875rem] text-black placeholder:text-[#A4A8AF] disabled:text-[#A4A8AF] text-base py-2 border border-[#D0D5DD] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
						/>
					</div>
				</div>

				{/* Details */}
				<div>
					<label htmlFor="details" className="block text-sm font-medium text-[#474E5C] mb-[0.375rem]">
						Details
					</label>
					<textarea
						id="details"
						rows={4}
						className="w-full min-h-[7.125rem] px-[0.875rem] text-black placeholder:text-[#A4A8AF] disabled:text-[#A4A8AF] text-base py-2 border border-[#D0D5DD] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
					></textarea>
				</div>

				{/* Additional Description */}
				<div>
					<label htmlFor="additional-description" className="block text-sm font-medium text-[#474E5C] mb-[0.375rem]">
						Additional Description
					</label>
					<textarea
						id="additional-description"
						rows={4}
						className="w-full min-h-[7.125rem]  px-[0.875rem] text-black placeholder:text-[#A4A8AF] disabled:text-[#A4A8AF] text-base py-2 border border-[#D0D5DD] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
					></textarea>
				</div>

				{/* Amenities & Features */}
				<div>
					{/* grid grid-cols-1 md:grid-cols-3 gap-6 */}

					<div className="relative grid grid-cols-1 md:grid-cols-2 gap-8">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-[0.375rem]">Amenities & Features</label>
							<button
								type="button"
								onClick={() => setIsAmenitiesOpen(!isAmenitiesOpen)}
								className="w-full flex items-center justify-between px-3 py-2 border border-[#D0D5DD] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
							>
								<span className="text-[#474E5C]">Select Amenities or Features</span>
								<ChevronDown className="w-5 h-5 text-gray-400" />
							</button>

							{isAmenitiesOpen && (
								<div className="absolute z-10 h-[30rem] overflow-hidden w-[21.875rem] mt-1 bg-white border border-[#D0D5DD] rounded-md shadow-lg p-4">
									<div className="p-2 bg-[#F4F6F8] h-[2.125rem] rounded-lg">
										<div className="relative flex items-center gap-2">
											<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6B7783] w-4 h-4" />
											<input
												type="text"
												placeholder="Search"
												className="w-full pl-10 pr-3 !max-h-full rounded-md focus:outline-none text-xs placeholder:text-[#6B7783] text-black"
											/>
										</div>
									</div>
									<div className="h-[calc(100%-2.125rem)] overflow-y-auto p-2">
										{amenityOptions.map((option) => (
											<div key={option.id} className="flex items-center py-1">
												<input
													type="checkbox"
													id={option.id}
													checked={selectedAmenities.includes(option.id)}
													onChange={() => handleAmenityToggle(option.id)}
													className="w-4 h-4 text-green-600 border-[#D0D5DD] rounded focus:ring-green-500"
												/>
												<label htmlFor={option.id} className="ml-2 text-sm text-gray-700">
													{option.label}
												</label>
											</div>
										))}
									</div>
								</div>
							)}

						</div>
						<div>
							<div className="w-full">
								<label className="block text-sm font-medium text-gray-700 mb-[0.375rem]">Custom</label>
								<div className="flex gap-2 w-full">
									<input
										type="text"
										placeholder="Type a custom Amenities or Features"
										value={customAmenity}
										onChange={(e) => setCustomAmenity(e.target.value)}
										className="py-2 px-[0.875rem] text-black placeholder:text-[#A4A8AF]  border w-full min-h-[2.75rem]   border-[#D0D5DD] rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
									/>
									<button
										type="button"
										onClick={handleAddCustomAmenity}
										className="px-3 py-2 bg-[#448C74] text-white font-medium rounded-lg min-w-[4.25rem] focus:outline-none text-base"
									>
										Add
									</button>
								</div>
							</div>
						</div>
					</div>

					{/* Selected Amenities as Tags */}
					{(selectedAmenities.length > 0 || customAmenities.length > 0) && (
						<div className="mt-4 flex flex-wrap gap-2">
							{selectedAmenities.map((id) => {
								const amenity = amenityOptions.find((option) => option.id === id)
								return (
									<span
										key={id}
										className="inline-flex items-center px-3 py-1 rounded-md text-sm bg-gray-100 text-gray-800 border"
									>
										{amenity?.label}
										<button
											type="button"
											onClick={() => handleRemoveAmenity(id)}
											className="ml-2 text-[#474E5C] hover:text-gray-700"
										>
											<X className="w-3 h-3" />
										</button>
									</span>
								)
							})}
							{customAmenities.map((amenity, index) => (
								<span
									key={`custom-${index}`}
									className="inline-flex items-center px-3 py-1 rounded-md text-sm bg-blue-100 text-blue-800 border"
								>
									{amenity}
									<button
										type="button"
										onClick={() => handleRemoveCustomAmenity(index)}
										className="ml-2 text-blue-600 hover:text-blue-800"
									>
										<X className="w-3 h-3" />
									</button>
								</span>
							))}
						</div>
					)}
				</div>

				{/* Property Images */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-[0.375rem]">Property Images</label>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						{propertyImages.map((image) => (
							<div key={image.id} className="relative group min-h-[8.75rem]">
								<img
									src={image.url || "/placeholder.svg"}
									alt="Property"
									className="w-full h-32 object-cover rounded-lg border border-[#D0D5DD]"
								/>
								<button
									type="button"
									onClick={() => handleRemovePropertyImage(image.id)}
									className="absolute w-8 h-8 top-2 right-2 flex items-center justify-center cursor-pointer text-[#FC3B3B] bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
								>
									<Trash2 className="w-5 h-5" />
								</button>
							</div>
						))}

						{/* Upload Area */}
						<div className="border border-[#D0D5DD] bg-[#F6F9FC] rounded-lg p-4 flex items-center justify-center bg[#F6F9FC] h-[8.75rem] w-[13.625rem]">
							<div className="text-center">
								<label className="cursor-pointer flex gap-2 w-[10.625rem] max-h-[2.75rem] items-center justify-center m-auto px-[1.125rem] py-[0.625rem] rounded-lg bg-[#FFFFFF] border border-[#D0D5DD]">
									<Upload className="w-5 h-5 text-[#000000] mb-2" />
									<span className="text-black font-medium text-sm">Upload image</span>
									<input
										type="file"
										multiple
										accept="image/*"
										className="hidden"
										onChange={(e) => handleImageUpload(e.target.files, "property")}
									/>
								</label>
							</div>
						</div>
					</div>
				</div>

				{/* Banner */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">Banner</label>
					{bannerImage ? (
						<div className="relative group">
							<img
								src={bannerImage.url || "/placeholder.svg"}
								alt="Banner"
								className="w-full h-48 object-cover rounded-lg border border-[#D0D5DD]"
							/>
									<button
									type="button"
								onClick={handleRemoveBannerImage}
									className="absolute w-8 h-8 top-2 right-2 flex items-center justify-center cursor-pointer text-[#FC3B3B] bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
								>
									<Trash2 className="w-5 h-5" />
								</button>
						</div>
					) : (
						<div className="border border-[#D0D5DD] bg-[#F6F9FC] rounded-lg p-8 flex flex-col items-center justify-center">
							<div className="text-center">
								<label className="cursor-pointer flex gap-2 w-[10.625rem] max-h-[2.75rem] items-center justify-center m-auto px-[1.125rem] py-[0.625rem] rounded-lg bg-[#FFFFFF] border border-[#D0D5DD]">
									<Upload className="w-5 h-5 text-[#000000] mb-2" />
									<span className="text-black font-medium text-sm">Upload image</span>
									<input
										type="file"
										accept="image/*"
										className="hidden"
										onChange={(e) => handleImageUpload(e.target.files, "banner")}
									/>
								</label>
								<p className=" text-[#474E5C] font-normal text-lg mt-1">Images should be horizontal</p>
							</div>
						</div>
					)}
				</div>

				{/* Form Actions */}
				<div className="flex justify-end gap-4 pt-4">
					<button
						type="button"
						className="px-[1.125rem] py-[0.625rem] border border-[#D0D5DD] text-base font-medium rounded-lg text-[#212A3B] bg-white  focus:outline-none "
					>
						Cancel
					</button>
					<button
						type="submit"
						className="px-6 py-2 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-[#448C74] focus:outline-none "
					>
						Creating Listing
					</button>
				</div>
			</form>
		</div>
	)
}
