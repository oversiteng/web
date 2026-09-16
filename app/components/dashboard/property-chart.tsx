"use client"

import { ApexOptions } from "apexcharts";
import { ChevronDown, Download, Filter, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect } from "react"
import { ReviewModal } from "./review-modal";
import ReactApexChart from "../Chart/ReactApexChartClient";



export function PropertyChart() {
	const [selectedPeriod, setSelectedPeriod] = useState("This Year")
	const [activeTab, setActiveTab] = useState("Expert Review")
	const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

	const handleShowMore = () => {
		setIsReviewModalOpen(true)
	}

	const handleCloseModal = () => {
		setIsReviewModalOpen(false)
	}

	const handleReviewItemClick = () => {
		setIsReviewModalOpen(true)
	}

	const datas = [
		{ month: "Jan", amount: 245000000 },
		{ month: "Feb", amount: 245000000 },
		{ month: "Mar", amount: 0 },
		{ month: "Apr", amount: 0 },
		{ month: "May", amount: 0 },
		{ month: "Jun", amount: 230000000 },
		{ month: "Jul", amount: 230000000 },
		{ month: "Aug", amount: 240000000 },
		{ month: "Sep", amount: 0 },
		{ month: "Oct", amount: 245000000 },
		{ month: "Nov", amount: 250000000 },
		{ month: "Dec", amount: 250000000 },
	];
	const shortFormatToNaira = (value: number) => {
		const million = 1_000_000;
		const rounded = Math.round(value / million);
		return `₦${rounded}M`;
	};
	const formatToNaira = (value: number) => {
		const million = 1_000_000;
		const rounded = Math.round(value / million);
		return `₦${rounded} Million`;
	};

	const [state, setState] = useState<{
		options: ApexOptions;
		series: ApexAxisChartSeries;
	}>({
		series: [{
			name: "STOCK ABC",
			data: datas.map((data) => data.amount)
		}],
		options: {
			chart: {
				type: 'area',
				height: '100%',
				zoom: {
					enabled: false
				},
				background: "#ffffff00",
				toolbar: {
					show: false
				},
				dropShadow: {
					enabled: true,
					top: 3,
					left: 2,
					blur: 4,
					color: "#000",
					opacity: 0.1
				}
			},
			dataLabels: {
				enabled: false,
			},

			labels: datas.map((data) => data.month),
			xaxis: {
				type: 'category',
				labels: {
					style: {
						colors: "#525252",
						fontSize: "12px"
					}
				},
				axisBorder: {
					color: "#e5e7eb"
				},
				axisTicks: {
					color: "#ffffff00"
				}
			},
			yaxis: {
				opposite: false,
				labels: {
					style: {
						colors: "#525252",
						fontSize: "12px"
					},
					formatter: shortFormatToNaira
				}
			},
			tooltip: {
				custom: ({ series, seriesIndex, dataPointIndex, labels, labelsIndex, w }) => {
					const value = series[seriesIndex][dataPointIndex];
					const label = w.globals.labels[dataPointIndex];
					return `<div style="background:#171D29;padding:8px 12px;border-radius:0.5rem;color:#fff;font-size:14px;display:flex;flex-direction:column;align-items:start;gap:4px;min-width:9.313rem;min-height:3.5rem;">
						<div style="color:#fff;font-size:14px;display:flex;width:100%;justify-content:space-between;font-size:0.75rem">${formatToNaira(value)} <span style="color:#ECF4F1;">-5.0%<span/></div>
						<div style="color:#e9eaeb;font-size:0.75rem;">${datas.map((data) => data.month)[label]} ${new Date().getFullYear()}</div>
					</div>`;
				},
				style: {
					fontSize: "14px"
				},
				y: {
					formatter: shortFormatToNaira
				}
			},
			grid: {
				show: true,
				borderColor: "#e5e7eb",
				strokeDashArray: 0,
				xaxis: {
					lines: {
						show: true
					}
				},
				yaxis: {
					lines: {
						show: true
					}
				},
				position: 'back'
			},
			stroke: {
				curve: 'straight',
				width: 3,
				colors: ["#448C74"]
			},
			fill: {
				type: "solid",
				colors: ["#ffffff00"]
			},

			legend: {
				horizontalAlign: 'left'
			}
		}
	});




	return (
		<>
			<div className="md:grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 flex flex-col-reverse lg:flex-row lg:grid">
				{/* Chart Section */}
				<div className="bg-white rounded-lg p-6 border border-gray-200">
					<div className="flex flex-col items-center justify-between mb-6">
						<div className="w-full flex items-center justify-between gap-2 mt-1">
							<h3 className="text-lg font-medium text-black">Sunnyvale Estates</h3>
							<div className="flex items-center gap-2">
								<button className="min-w-[7.375rem] min-h-[2.25rem] flex items-center gap-2 px-4 py-2 border border-[#D0D5DD] text-[#212A3B] rounded-lg text-sm font-normal cursor-pointer">
									{selectedPeriod}
									<ChevronDown className="w-4 h-4" />
								</button>
								<button className="min-w-[7.375rem] min-h-[2.25rem] flex items-center gap-2 px-4 py-2 border border-[#D0D5DD] text-[#212A3B] rounded-lg text-sm font-normal cursor-pointer">
									<Download className="w-4 h-4" />
									Export pdf
								</button>
							</div>
						</div>
						<div className="w-full flex items-center justify-between gap-2 mt-1">
							<span className="text-lg text-[#212A3B] font-medium">₦201,000,000</span>
							<span className="text-[#306251] text-base font-medium">▲ +0.05%</span>
						</div>
					</div>

					{/* Chart Placeholder */}

					<div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center mb-4">
						<div className="text-center w-full h-full">
							<div className="w-full h-full relative">
								<div id="chart w-full h-full">
									<ReactApexChart options={state.options} series={state.series} type="area" className="h-64" height={"100%"} width={"100%"} />
								</div>
							</div>
						</div>
					</div>

					{/* Navigation */}
					<div className="flex items-center justify-center gap-8">
						<button className="flex items-center text-[#306251] text-sm gap-2 h-[1.25rem] disable:text-[#7E838D] cursor-pointer">
							<ChevronLeft className="w-4 h-4" />
							Previous Property
						</button>
						<button className="flex items-center text-[#306251] text-sm gap-2 h-[1.25rem] disable:text-[#7E838D] cursor-pointer">
							Next Property
							<ChevronRight className="w-4 h-4" />
						</button>
					</div>
				</div>

				{/* Review Section */}
				<div className="bg-white rounded-lg p-6 border border-gray-200">
					<div className="flex items-center justify-between mb-6">
						<h3 className="text-base font-medium text-[#212A3B]">Review</h3>
						<div className="flex items-center gap-2">
							<button className="flex items-center gap-2 px-3 py-2 font-normal text-sm text-[#212A3B] cursor-pointer">
								<Filter className="w-4 h-4" />
								Filters
							</button>
							<button className="flex items-center gap-2 px-3 py-2 font-normal text-sm text-[#212A3B] cursor-pointer"
								onClick={handleShowMore}>
								<MoreHorizontal className="w-4 h-4" />
								Show more
							</button>
						</div>
					</div>

					{/* Tabs */}
					<div className="flex gap-4 mb-6 bg-[#F4F6F8] p-1	rounded-lg max-w-[28.313rem] min-h-[2.75rem]">
						<button
							className={`py-2 px-4 border-[1px] border-[#ECF4F1] rounded-lg min-[2.125rem] w-full cursor-pointer ${activeTab === "Expert Review" ? "bg-[#FFFFFF] text-[#306251]" : " text-[#A4A8AF]"}`}
							onClick={() => setActiveTab("Expert Review")}
						>
							Expert Review
						</button>
						<button
							className={`py-2 px-4 border-[1px] border-[#ECF4F1] rounded-lg min-[2.125rem] w-full cursor-pointer ${activeTab === "State Policy Updates" ? "bg-[#FFFFFF] text-[#306251]" : "text-[#A4A8AF]"}`}
							onClick={() => setActiveTab("State Policy Updates")}
						>
							State Policy Updates
						</button>
					</div>

					{/* Review Items */}
					<div className="space-y-4">
						<div className="flex gap-3">
							<div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
							<div>
								<p className="text-xs text-gray-500 mb-1">Feb 5, 2024 09:15AM</p>
								<p className="text-sm text-gray-700">
									The Lagos State Government has proposed that the every property can not be owned beyond 100years. After
									which it is the property of state.
								</p>
								<a href="#" className="text-green-600 text-xs hover:underline">
									Details available at the url http://lagsgov.com/landuse/new
								</a>
							</div>
						</div>

						<div className="flex gap-3">
							<div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
							<div>
								<p className="text-xs text-gray-500 mb-1">Feb 5, 2024 09:15AM</p>
								<p className="text-sm text-gray-700">
									The Lagos State Government has proposed that the every property can not be owned beyond 100years. After
									which it is the property of state.
								</p>
								<a href="#" className="text-green-600 text-xs hover:underline">
									Details available at the url http://lagsgov.com/landuse/new
								</a>
							</div>
						</div>

						<div className="flex gap-3">
							<div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
							<div>
								<p className="text-xs text-gray-500 mb-1">Feb 5, 2024 09:15AM</p>
								<p className="text-sm text-gray-700">
									The Lagos State Government has proposed that the every property can not be owned beyond 100years.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
			{/* Review Modal */}
			<ReviewModal isOpen={isReviewModalOpen} onClose={handleCloseModal} />
		</>
	)
}
