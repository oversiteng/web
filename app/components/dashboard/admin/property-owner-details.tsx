"use client"

interface PropertyOwner {
	firstName: string
	lastName: string
	username: string
	email: string
	phoneNumber: string
	avatar?: string
}

interface PropertyOwnerDetailsProps {
	owner?: PropertyOwner
	className?: string
}

export function PropertyOwnerDetails({ owner, className = "" }: PropertyOwnerDetailsProps) {
	return (
		<div className={`rounded-xl p-6 mt-6 ${className}`}>
			<h2 className="text-xl font-medium text-[#474E5C] mb-6">Property Owner Details</h2>
			<div className="flex flex-col xl:flex-row gap-6">
				<div className="flex-shrink-0">
					<div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200">
						<img

							src={owner?.avatar || "/prop-value-profile-img.jpg"}
							alt={`${owner?.firstName ?? ""} ${owner?.lastName ?? ""}`}
							className="w-full h-full object-cover"
						/>

					</div>
				</div>

				<div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-6">
					<div>
						<label className="block text-sm font-medium text-gray-500 mb-1">First Name</label>
						<p className="text-gray-900 font-medium">{owner?.firstName ?? "Over"}</p>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-500 mb-1">Last Name</label>
						<p className="text-gray-900 font-medium">{owner?.lastName ?? "Sight"}</p>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-500 mb-1">Username</label>
						<p className="text-gray-900 font-medium">{owner?.username ?? "Oversite"}</p>
					</div>
					{/* Second Row: Email and Phone Number, each spanning 3 columns on mobile, 1.5 columns each on md+ */}
					<div className="md:col-span-2">
						<label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
						<p className="text-gray-900 font-medium">{owner?.email ?? "oversite@gmail.com"}</p>
					</div>
					<div className="md:col-span-1">
						<label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
						<p className="text-gray-900 font-medium">{owner?.phoneNumber ?? "09023348459"}</p>
					</div>
				</div>
			</div>
		</div>
	)
}
