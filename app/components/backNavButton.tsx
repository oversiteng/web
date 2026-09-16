import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export const BackNavButton = ({ overRideAction }: { overRideAction?: () => void }) => {
	const router = useRouter()
	const handleBackClick = () => {
		if (typeof overRideAction == "function") return overRideAction?.()
		router.back()
	}
	return <button onClick={handleBackClick} className="flex text-[#474E5C] items-center gap-2 cursor-pointer">
		<ChevronLeft className="w-4 h-4" />
		<span>Back</span>
	</button>
}
