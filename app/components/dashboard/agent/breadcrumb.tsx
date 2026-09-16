import { Plus } from "lucide-react"
import { BackNavButton } from "../../backNavButton"
import AddReviewModal from "../admin/add-review"
import { AddReviewModal as AddReviewModal2 } from "../admin/add-review-modal"
import { useState } from "react"

interface OverViewBreadCrumbs {
	switchModal?: "landmarks" | "building-material-cost",
	property?: string,
	page?: string,
	overRideAction?: () => void
}
export const OverViewBreadCrumbs = ({ switchModal, property, page, overRideAction }: OverViewBreadCrumbs) => {
	const [openModal, setOpenModal] = useState<boolean>(false)


	return (
		<div className="h-11">
			<div className="flex items-center justify-between">
				<div className="flex flex-col md:flex-row md:items-center justify-between">
					<div className="flex items-center gap-4 mb-4 md:mb-0">
						<BackNavButton {...(overRideAction ? { overRideAction } : {})} />

						<nav className="text-sm text-[#7E838D]">
							<span>My Properties</span>
							<span className="mx-2">/</span>
							<span className="max-w-[70px] truncate inline-block align-bottom" title="GreenLand Estate">
								{property ?? "GreenLand Estate"}
							</span>
							<span className="mx-2">/</span>
							<span className="max-w-[50px] md:max-w-[100px] lg:max-w-[160px] sm:max-w-[60px] inline-block truncate align-bottom text-[#212A3B]" title="Estimated Property Value">{page}</span>
						</nav>
					</div>
				</div>
				<button
					onClick={() => setOpenModal(true)}
					className="flex items-center gap-2 px-4 py-2 bg-[#448C74] text-white rounded-lg hover:bg-[#448C74] transition-colors cursor-pointer"
				>
					<Plus className="w-4 h-4" />
					Add New
				</button>
			</div>
			{switchModal ?
				<AddReviewModal2 isOpen={openModal} onClose={() => setOpenModal(false)} onSubmit={() => setOpenModal(false)} initialReviewType={switchModal} />
				:
				<AddReviewModal isOpen={openModal} onClose={() => setOpenModal(false)} />
			}
		</div>
	)
}
