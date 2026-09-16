import { ChevronLeft, ChevronRight } from "lucide-react"
type PaginationProps = {
	currentPage: number;
	totalPages: number;
	handlePageChange: (arg: number) => void
};

export const Pagination = ({ currentPage, handlePageChange, totalPages }: PaginationProps) => {
	return (
						<div className="flex items-center justify-center gap-2 p-6 border-t">
	<div className="flex items-center justify-center gap-14" style={{ gap: "3.5rem" }}>
		<button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#212A3B] cursor-pointer disabled:cursor-not-allowed disabled:text-gray-300"
			onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
			disabled={currentPage === 1}
		>
			<ChevronLeft className="w-4 h-4" />
			Previous
		</button>
		{/* <div className="flex items-center gap-1"> */}
		<div className="hidden md:flex items-center gap-1  mx-14">
			{Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
				const page = i + 1
				if (totalPages <= 10) {
					return (
						<button
							key={page}
							onClick={() => handlePageChange(page)}
							className={`w-8 h-8 rounded ${currentPage === page ? "bg-green-100 text-[028755]" : "text-gray-600 hover:bg-gray-100"
								}`}
						>
							{page}
						</button>
					)
				}
				// Show first few, ellipsis, and last few pages for large page counts
				if (page <= 3 || page > totalPages - 3 || Math.abs(page - currentPage) <= 1) {
					return (
						<button
							key={page}
							onClick={() => handlePageChange(page)}
							className={`w-8 h-8 rounded cursor-pointer ${currentPage === page ? "bg-green-100 text-[028755]" : "text-gray-600 hover:bg-gray-100"
								}`}
						>
							{page}
						</button>
					)
				}
				if (page === 4 && currentPage > 6) {
					return (
						<span key="ellipsis1" className="px-2 text-gray-400">
							...
						</span>
					)
				}
				if (page === totalPages - 3 && currentPage < totalPages - 5) {
					return (
						<span key="ellipsis2" className="px-2 text-gray-400">
							...
						</span>
					)
				}
				return null
			})}
		</div>


		<button className="flex items-center gap-2 px-3 py-2 text-sm text-[#212A3B] cursor-pointer disabled:cursor-not-allowed disabled:text-gray-300"
			onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
			disabled={currentPage === totalPages}>
			Next
			<ChevronRight className="w-4 h-4" />
		</button>
	</div>
	</div>
	)
}

 