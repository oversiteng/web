interface PropertyCardProps {
	title: string
	buildingType: string
	type: string
	createdOn: string
	image?: string
	action: ()=> void
}

export function PropertyCard({ title, buildingType, type, createdOn, image, action }: PropertyCardProps) {
	return (
		<div className="cursor-pointer bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow" onClick={action}>
			<div className="aspect-video bg-gray-300 flex items-center justify-center">
				{image ? (
					<img src={image || "/placeholder.svg"} alt={title} className="w-full h-full object-cover" />
				) : (
					<div className="w-full h-full bg-gray-300"></div>
				)}
			</div>
			<div className="p-4">
				<h3 className="font-semibold text-gray-900 mb-3">{title}</h3>
				<div className="grid grid-cols-3 gap-4 text-sm">
					<div>
						<p className="text-gray-500 mb-1">Building Type</p>
						<p className="font-medium text-gray-900">{buildingType}</p>
					</div>
					<div>
						<p className="text-gray-500 mb-1">Type</p>
						<p className="font-medium text-gray-900">{type}</p>
					</div>
					<div>
						<p className="text-gray-500 mb-1">Created on</p>
						<p className="font-medium text-gray-900">{createdOn}</p>
					</div>
				</div>
			</div>
		</div>
	)
}
