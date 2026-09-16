"use client"

import type React from "react"

import { useState } from "react"
import { ArrowLeft, Search, SlidersHorizontal } from "lucide-react"
import { BackNavButton } from "../backNavButton"
import { OverViewBreadCrumbs } from "./agent/breadcrumb"
import OverviewTab from "./agent/overviewTap"

interface BuildingMaterial {
  id: string
  name: string
  unit: string
  previousPrice: number
  currentPrice: number
  dateCreated: string
  lastUpdated: string
}

interface BuildingMaterialCostProps {
  isMobile?: boolean
}

const buildingMaterials: BuildingMaterial[] = [
  {
    id: "1",
    name: "Dangote Cement",
    unit: "Bag",
    previousPrice: 3500,
    currentPrice: 4000,
    dateCreated: "July 21, 2023",
    lastUpdated: "Apr 21, 2024",
  },
  {
    id: "2",
    name: "Reinforcing Steel",
    unit: "Metric Ton",
    previousPrice: 450000,
    currentPrice: 500000,
    dateCreated: "Aug 21, 2023",
    lastUpdated: "Apr 21, 2024",
  },
  {
    id: "3",
    name: "Sand",
    unit: "Cubic Meter",
    previousPrice: 20000,
    currentPrice: 25000,
    dateCreated: "July 21, 2023",
    lastUpdated: "Apr 21, 2024",
  },
  {
    id: "4",
    name: "Bricks",
    unit: "1,000 Pieces",
    previousPrice: 150000,
    currentPrice: 180000,
    dateCreated: "July 21, 2023",
    lastUpdated: "Apr 21, 2024",
  },
  {
    id: "5",
    name: "Roofing Sheets",
    unit: "Square Meter",
    previousPrice: 3500,
    currentPrice: 4000,
    dateCreated: "July 21, 2023",
    lastUpdated: "Apr 21, 2024",
  },
]

export default function BuildingMaterialCost({ isMobile = false }: BuildingMaterialCostProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredMaterials, setFilteredMaterials] = useState<BuildingMaterial[]>(buildingMaterials)

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)

    if (query.trim() === "") {
      setFilteredMaterials(buildingMaterials)
    } else {
      const filtered = buildingMaterials.filter((material) => material.name.toLowerCase().includes(query.toLowerCase()))
      setFilteredMaterials(filtered)
    }
  }

  const handleBackClick = () => {
    console.log("Back clicked")
  }

  const handleFiltersClick = () => {
    console.log("Filters clicked")
  }

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`
  }

  return (
    <div className="min-h-screen">
      <OverViewBreadCrumbs property={"GreenLand Estate"} page={"Building Material Cost"} />
      <div className="py-4 md:py-6 flex flex-col gap-4">
        <h1 className="text-[1.313rem] font-medium text-[#212A3B]">GreenLand Estate</h1>
        <div className="bg-white border border-[#E9EAEB] rounded-2xl shadow-sm shadow-[#1E1E1E05] py-[0.875rem] px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-[1.313rem] font-medium text-[#212A3B]">Building Material Cost</h2>
              <span className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-600 text-base font-normal rounded-full">
                {buildingMaterials.length}
              </span>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 bg-[#F6F9FC] text-[#212A3B] placeholder:text-[#A4A8AF] rounded-[3.625rem] focus:outline-none  focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              <button
                onClick={handleFiltersClick}
                className="flex items-center gap-2 px-4 py-2"
              >
                <SlidersHorizontal className="w-4 h-4 text-[#212A3B]" />
                <span className="text-sm text-gray-700">Filters</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto ">
            <table className="w-full h-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-[1.125rem]  min-h-15 text-base font-medium text-[#7E838D]">Building Material</th>
                  <th className="text-left py-[1.125rem]  min-h-15 text-base font-medium text-[#7E838D]">Unit</th>
                  <th className="text-left py-[1.125rem]  min-h-15 text-base font-medium text-[#7E838D]">Previous Price</th>
                  <th className="text-left py-[1.125rem]  min-h-15 text-base font-medium text-[#7E838D]">Current Price</th>
                  <th className="text-left py-[1.125rem]  min-h-15 text-base font-medium text-[#7E838D]">Date Created</th>
                  <th className="text-left py-[1.125rem]  min-h-15 text-base font-medium text-[#7E838D]">Late Updated</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterials.map((material) => (
                  <tr key={material.id} className="hover:bg-gray-50">
                    <td className="py-[1.125rem] min-h-15 text-base font-normal text-[#212A3B]">{material.name}</td>
                    <td className="py-[1.125rem] min-h-15 text-base font-normal text-[#212A3B]">{material.unit}</td>
                    <td className="py-[1.125rem] min-h-15 text-base font-normal text-[#212A3B]">{formatCurrency(material.previousPrice)}</td>
                    <td className="py-[1.125rem] min-h-15 text-base font-normal text-[#212A3B]">{formatCurrency(material.currentPrice)}</td>
                    <td className="py-[1.125rem] min-h-15 text-base font-normal text-[#212A3B]">{material.dateCreated}</td>
                    <td className="py-[1.125rem] min-h-15 text-base font-normal text-[#212A3B]">{material.lastUpdated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
