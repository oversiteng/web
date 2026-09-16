"use client"
import { MoreHorizontal, Edit, Archive, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Ad } from "@/libs/interface"

interface AdCardProps {
	ad: Ad
	onEdit: (ad: Ad) => void
	onArchive: (ad: Ad) => void
	onDelete: (ad: Ad) => void
}

export function AdCard({ ad, onEdit, onArchive, onDelete }: AdCardProps) {
	return (
		<div className="relative group">
			<div className="bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 rounded-xl p-6 text-white min-h-[200px] flex flex-col justify-between">
				{/* Content */}
				<div>
					<h3 className="text-2xl font-bold mb-3">{ad.title}</h3>
					<p className="text-purple-100 text-sm leading-relaxed">{ad.description}</p>
				</div>

				{/* Menu Button */}
				<div className="absolute top-4 right-4">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="text-white hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
							>
								<MoreHorizontal className="w-5 h-5" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48">
							<DropdownMenuItem onClick={() => onEdit(ad)}>
								<Edit className="w-4 h-4 mr-2" />
								Edit
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => onArchive(ad)}>
								<Archive className="w-4 h-4 mr-2" />
								Archive
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => onDelete(ad)} className="text-red-600 focus:text-red-600">
								<Trash2 className="w-4 h-4 mr-2" />
								Delete Ads
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</div>
	)
}
