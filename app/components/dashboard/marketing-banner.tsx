import { useState, useEffect } from "react";
const slides = [
	{
		title: "Do more for your Brand!",
		description: "Create a marketing campaign to attract more customers.",
		image: "/ads1.png",
	},
	{
		title: "Boost Your Reach!",
		description: "Expand your audience with targeted ads.",
		image: "/ads1.png",
	},
	{
		title: "Analyze Performance",
		description: "Track your campaign results in real time.",
		image: "/ads1.png",
	},
	{
		title: "Engage Customers",
		description: "Send personalized offers and updates.",
		image: "/ads1.png",
	},
];

export function MarketingBanner() {
	const [current, setCurrent] = useState(0);

	const goTo = (idx: number) => setCurrent(idx);

	useEffect(() => {
		const timer = setInterval(() => {
			setCurrent((prev) => (prev + 1) % slides.length);
		}, 4000);
		return () => clearInterval(timer);
	}, []);

	return (
		<div className="relative rounded-lg p-8 pb-[1.313rem] mb-6 overflow-hidden h-[200px] flex items-center">
			{/* Background image */}
			<div
				className="absolute inset-0 w-full h-full bg-cover bg-center z-0"
				style={{
					backgroundImage: `url(${slides[current].image})`,
					backgroundSize: "cover",
					backgroundPosition: "center",
					filter: "brightness(0.5)",
				}}
				aria-hidden="true"
			/>
			{/* Overlay content */}
			<div className="relative z-10 flex flex-col md:flex-row items-center gap-6 w-full h-full ">
				<div className="flex-1 text-center md:text-left h-full">
					<h3 className="text-[2.375rem] font-semibold text-white mb-2">{slides[current].title}</h3>
					<p className="text-[#FFFFFF] text-[1.313rem] font-normal mb-6">{slides[current].description}</p>
					{/* Pagination dots */}
					<div className="flex gap-2 min-w-full items-baseline-last absolute -bottom-[0.469rem] justify-center">
						{slides.map((_, idx) => (
							<button
								key={idx}
								className={`w-[1.625rem] h-[0.375rem] rounded-full transition-colors ${idx === current ? "bg-white" : "bg-white/50"
									}`}
								aria-label={`Go to slide ${idx + 1}`}
								onClick={() => goTo(idx)}
							/>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
