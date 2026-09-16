import { useState } from "react"
import { BackNavButton } from "../backNavButton"

interface OverViewBreadCrumbs {
	property?: string,
	page?: string,
	overRideAction?: () => void
}
export const OverViewBreadCrumbs = ({ property, page, overRideAction }: OverViewBreadCrumbs) => {


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
							<span className="max-w-[160px] inline-block truncate align-bottom text-[#212A3B]" title="Estimated Property Value">{page}</span>
						</nav>
					</div>
				</div>
			</div>
		</div>
	)
}
