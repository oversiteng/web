"use client"

import { Plus, Minus, Crosshair } from "lucide-react"

export function GlobalMap() {
	return (
		<div className="bg-white rounded-lg border border-gray-200 relative overflow-hidden">
			<div className="absolute top-4 left-4 z-10">
				<h3 className="text-lg font-semibold text-gray-900 bg-white px-3 py-1 rounded">Global Statistics</h3>
			</div>

			{/* Map controls */}
			<div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
				<button className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50">
					<Plus className="w-4 h-4" />
				</button>
				<button className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50">
					<Minus className="w-4 h-4" />
				</button>
			</div>

			<div className="absolute bottom-4 right-4 z-10">
				<button className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50">
					<Crosshair className="w-4 h-4" />
				</button>
			</div>

			{/* Map placeholder */}
			<div className="h-96 bg-gray-100 flex items-center justify-center">
				<div className="text-center text-gray-500">
					<p className="text-lg font-medium">World Map</p>
					<p className="text-sm">Global property statistics visualization</p>
				</div>
			</div>
		</div>
	)
}
