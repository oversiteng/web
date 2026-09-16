import { Cloud } from "lucide-react"

interface WelcomeSectionProps {
	userName?: string
	weather?: string
	temperature?: string
	date?: string
	time?: string
}

export function WelcomeSection({
	userName = "Timothy",
	weather = "Scattered Cloud",
	temperature = "25.03 °C",
	date = "Tue 24 January",
	time = "12:00 PM",
}: WelcomeSectionProps) {
	return (

		<div className="bg-[#ECF4F1] rounded-lg p-6 mb-6 welcome-section-card-wrapper">
			<div className="rounded-lg p-4 text-white welcome-section-card"> </div>
			<div className="flex flex-col md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="text-2xl md:text-3xl font-semibold text-[#306251] mb-2">Good morning, {userName}!</h1>
					<div className="flex items-center gap-2 text-gray-600">
						<Cloud className="w-4 h-4" />
						<span className="text-sm">
							{weather}, {temperature} • {date}, {time}
						</span>
					</div>
				</div>

				{/* <div className="mt-4 md:mt-0">
					<div className="flex items-center gap-4 w-full justify-between">
						<div className="md:flex gap-4 text-left">
							<p className="text-base text-[#474E5C]">Property listed</p>
							<div className="flex items-center gap-2">
								<div className="w-[8.063rem] bg-gray-200 rounded-full h-2">
									<div className="bg-[#448C74] h-2 rounded-full" style={{ width: "66%" }}></div>
								</div>
								<span className="text-sm font-medium text-[#474E5C]">2/3</span>
							</div>
						</div>
						<Link
							href="dashboard/properties/new-property"
							className="bg-[#448C74] hover:bg-[#448C70] text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer"
						>
							+ Add a property
						</Link>
					</div>
				</div> */}
			</div>
		</div>
	)
}
