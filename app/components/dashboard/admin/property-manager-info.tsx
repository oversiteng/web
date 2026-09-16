"use client"

import { Home } from "lucide-react"
import { PropertyOwnerDetails } from "./property-owner-details"

interface PropertyManagerInfoProps {
	hasManager?: boolean
	managerName?: string
	onAssignProperty?: () => void
	className?: string
}

export function PropertyManagerInfo({
	hasManager = false,
	managerName,
	onAssignProperty,
	className = "",
}: PropertyManagerInfoProps) {

	const propertyOwner = {
		firstName: managerName ?? "Timothy",
		lastName: "Daniels",
		username: "Tim",
		email: "hello@oversite.com",
		phoneNumber: "081234567890",
		avatar: "/prop-value-profile-img.jpg",
	}

	return (
		<>
			{hasManager ? (
				<div className="text-center" >
					<PropertymanagerDetails owner={propertyOwner} className="h-full" />
				</div>
			) : (
				<div className={`flex flex-col justify-between bg-white max-h-[24.875rem] rounded-lg border p-6 ${className}`}>
					<h2 className="text-lg font-medium text-[#474E5C]">Property Manager Information</h2>
					<div className="flex flex-col gap-6 items-center justify-center m-auto">
						<div className="flex flex-col gap-[0.125rem] items-center justify-center">
							<Home className="w-12 h-10 text-[#448C74]" />
							<p className="text-center text-[#000000] font-medium text-lg mb-6 max-w-sm">This property has not been assigned to a manager yet.</p>
						</div>
						<button
							onClick={onAssignProperty}
							className="cursor-pointer bg-[#448C74] text-white px-6 py-3 rounded-lg font-medium"
						>
							Assign Property
						</button>
					</div>
				</div>
			)}
		</>
	)
}


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

function PropertymanagerDetails({ owner, className = "" }: PropertyOwnerDetailsProps) {
	return (
		<div className={`flex flex-col rounded-xl p-6 mt-6 ${className} border-2`}>
			<h2 className="text-xl font-medium text-[#474E5C] mb-6">Property Manager Information</h2>
			<div className="flex flex-col gap-6">
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
					<div className="text-left">
						<label className="block text-sm font-medium text-gray-500 mb-1">First Name</label>
						<p className="text-gray-900 font-medium">{owner?.firstName ?? "Over"}</p>
					</div>
					<div className="text-left">
						<label className="block text-sm font-medium text-gray-500 mb-1">Last Name</label>
						<p className="text-gray-900 font-medium">{owner?.lastName ?? "Sight"}</p>
					</div>
					<div className="text-left">
						<label className="block text-sm font-medium text-gray-500 mb-1">Username</label>
						<p className="text-gray-900 font-medium">{owner?.username ?? "Oversite"}</p>
					</div>
					{/* Second Row: Email and Phone Number, each spanning 3 columns on mobile, 1.5 columns each on md+ */}
					<div className="md:col-span-2 text-left">
						<label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
						<p className="text-gray-900 font-medium">{owner?.email ?? "oversite@gmail.com"}</p>
					</div>
					<div className="md:col-span-1 text-left">
						<label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
						<p className="text-gray-900 font-medium">{owner?.phoneNumber ?? "09023348459"}</p>
					</div>
				</div>
			</div>
		</div>
	)
}
