"use client"

import { useState } from "react"
import { ApexOptions } from "apexcharts";
import ReactApexChart from "../../Chart/ReactApexChartClient"

interface ChartData {
  month: string
  users: number
  agents: number
}
export function AdminChart() {

  const [activeTab, setActiveTab] = useState("12 months")
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; data: any } | null>(null)

  const chartData: ChartData[] = [
    { month: "Jan", users: 30, agents: 15 },
    { month: "Feb", users: 35, agents: 18 },
    { month: "Mar", users: 40, agents: 20 },
    { month: "Apr", users: 60, agents: 25 },
    { month: "May", users: 80, agents: 30 },
    { month: "Jun", users: 85, agents: 32 },
    { month: "Jul", users: 90, agents: 35 },
    { month: "Aug", users: 95, agents: 38 },
    { month: "Sep", users: 100, agents: 40 },
    { month: "Oct", users: 95, agents: 38 },
    { month: "Nov", users: 85, agents: 35 },
    { month: "Dec", users: 80, agents: 32 },
  ]
  const maxValue = Math.max(...chartData.map((d) => Math.max(d.users, d.agents)))
  const chartHeight = 200
  const chartWidth = 800


  const datas = [
    { month: "Jan", amount: 1500000 },
    { month: "Feb", amount: 1500000 },
    { month: "Mar", amount: 2000000 },
    { month: "Apr", amount: 6000000 },
    { month: "May", amount: 1000000 },
    { month: "Jun", amount: 2500000 },
    { month: "Jul", amount: 2500000 },
    { month: "Aug", amount: 1500000 },
    { month: "Sep", amount: 6000000 },
    { month: "Oct", amount: 1500000 },
    { month: "Nov", amount: 3000000 },
    { month: "Dec", amount: 3000000 },
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

  const getYPosition = (value: number) => {
    return chartHeight - (value / maxValue) * chartHeight
  }

  const getXPosition = (index: number) => {
    return (index / (chartData.length - 1)) * chartWidth
  }

  const userPath = chartData
    .map((d, i) => `${i === 0 ? "M" : "L"} ${getXPosition(i)} ${getYPosition(d.users)}`)
    .join(" ")

  const agentPath = chartData
    .map((d, i) => `${i === 0 ? "M" : "L"} ${getXPosition(i)} ${getYPosition(d.agents)}`)
    .join(" ")

  return (
    <div className="md:bg-white rounded-lg border p-6">
      <div className="flex flex-col md:gap-4 gap-6 mb-4">

        <h3 className="text-lg font-medium text-[#000000] lg:mb-0">Onboarding Metrics</h3>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between md:gap-4 gap-6">
          <div className="flex items-center gap-4 bg-gray-100 rounded-lg px-2 py-1 min-h-[2.625rem] w-full md:max-w-[21.438rem]">
            {["12 months", "30 days", "7 days"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full cursor-pointer px-4 py-2 min-h-[2.125rem] rounded-md text-sm font-medium transition-colors ${activeTab === tab ? "bg-white text-[#306251] shadow-sm" : "text-[#A4A8AF] hover:text-gray-900"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center">
            <div className="flex flex-col items-start w-[13.188rem] gap-2 h-[7.125rem] bg-[#ECF4F1] p-6 border border-[#E9EAEB]">
              <div className="flex items-center gap-4">
                <div className="w-6 h-[0.625rem] bg-[#448C74] rounded-full"></div>
                <span className="text-sm text-gray-600">oversite User</span>
              </div>
              <span className="text-[1.313rem] font-medium text-[#212A3B]">1,034</span>
            </div>
            <div className="flex flex-col items-start w-[13.188rem] gap-2 h-[7.125rem] p-6 border border-[#E9EAEB]">
              <div className="flex items-center gap-4">
                <div className="w-6 h-[0.625rem] bg-[#7E838D] rounded-full"></div>
                <span className="text-sm text-[#474E5C]">oversite Agent</span>
              </div>
              <span className="text-[1.313rem] font-medium text-[#212A3B]">34</span>
            </div>
          </div>
        </div>
      </div>


      <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center mb-4">
        <div className="text-center w-full h-full">
          <div className="w-full h-full relative">
            <div id="chart w-full h-full">
              <ReactApexChart options={state.options} series={state.series} type="area" className="h-64" height={"100%"} width={"100%"} />
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
