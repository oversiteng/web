"use client"

import type React from "react"

import { useState } from "react"
import { Pen, Search, SlidersHorizontal, Trash2 } from "lucide-react"
import { OverViewBreadCrumbs } from "./breadcrumb"
import OverviewTab from "./overviewTap"
// import AddReviewModal from "../admin/add-review"
import { Pagination } from "../../pagination"
import { AddReviewModal } from "../admin/add-review-modal"

interface BuildingMaterial {
  id: string
  name: string
  unit: string
  previousPrice: number
  currentPrice: number
  dateCreated: string
  lastUpdated: string
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

export default function BuildingMaterialCost() {
  const [searchQuery, setSearchQuery] = useState("")
  const [openEditModal, setOpenEditModal] = useState(false)
  const [filteredMaterials, setFilteredMaterials] = useState<BuildingMaterial[]>(buildingMaterials)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

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

  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage)

  const handleEdit = (id: string) => {
    setOpenEditModal(true)
  }

  const handleFiltersClick = () => {
    console.log("Filters clicked")
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }


  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`
  }

  const handleDelete = (id: string) => {
    setFilteredMaterials((prev) => prev.filter((material) => material.id !== id));
  };
  return (
    <div className="min-h-screen">
      <OverViewBreadCrumbs property={"GreenLand Estate"} page={"Building Material Cost"} switchModal={"building-material-cost"} />
      <div className="py-4 md:py-6 flex flex-col gap-4">
        <div className="md:hidden block">
          <OverviewTab />
        </div>
        <h1 className="text-[1.313rem] font-medium text-[#212A3B]">GreenLand Estate</h1>
        <div className="md:hidden flex items-center gap-4 w-full md:w-auto">
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

        <div className="md:block hidden">
          <OverviewTab />
        </div>
        <div className="bg-white border border-[#E9EAEB] rounded-2xl shadow-sm shadow-[#1E1E1E05] py-[0.875rem] px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-[1.313rem] font-medium text-[#212A3B]">Building Material Cost</h2>
              <span className="flex items-center justify-center w-8 h-8 bg-gray-100 text-[#474E5C] text-base font-normal rounded-full">
                {buildingMaterials.length}
              </span>
            </div>
            <div className="md:flex hidden  items-center gap-4 w-full md:w-auto">
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
          <div className="hidden md:block overflow-x-auto ">
            <table className="w-full h-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-[1.125rem]  min-h-15 text-base font-medium text-[#7E838D]">Building Material</th>
                  <th className="text-left py-[1.125rem]  min-h-15 text-base font-medium text-[#7E838D]">Unit</th>
                  <th className="text-left py-[1.125rem]  min-h-15 text-base font-medium text-[#7E838D]">Previous Price</th>
                  <th className="text-left py-[1.125rem]  min-h-15 text-base font-medium text-[#7E838D]">Current Price</th>
                  <th className="text-left py-[1.125rem]  min-h-15 text-base font-medium text-[#7E838D]">Date Created</th>
                  <th className="text-left py-[1.125rem]  min-h-15 text-base font-medium text-[#7E838D]">Late Updated</th>
                  <th className="text-left py-[1.125rem]  min-h-15 text-base font-medium text-[#7E838D]"></th>
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

                    <td className="py-[1.125rem] min-h-15 text-base font-normal text-[#212A3B]">
                      <div className="flex items-center gap-3">
                        <button className="cursor-pointer" type="button" aria-label="Edit" onClick={() => handleEdit(material.id)}>
                          <Pen className="w-5 h-5 text-[#448C74]" />
                        </button>
                        <button className="cursor-pointer" onClick={() => handleDelete(material.id)} type="button" aria-label="Delete">
                          <Trash2 className="w-5 h-5 text-[#448C74]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-100">
            {filteredMaterials.map((material) => (
              <div key={material.id} className="p-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-[#7E838D]">Building Material</span>
                    <span className="text-gray-900 font-medium">{material.name}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-[#7E838D]">Unit</span>
                    <span className="text-[#474E5C] text-sm">{material.unit}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-[#7E838D]">Previous Price</span>
                    <span className="text-[#474E5C] text-sm">{material.previousPrice}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-[#7E838D]">Current Price</span>
                    <span className="text-[#474E5C] text-sm">{material.currentPrice}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <div className="pt-3 flex align-center justify-center gap-2">
                      <span className="text-sm text-[#7E838D]">Updated</span>
                      <span className="text-[#474E5C] text-sm">{material.lastUpdated}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="cursor-pointer" type="button" aria-label="Edit" onClick={() => handleEdit(material.id)}>
                        <Pen className="w-5 h-5 text-[#448C74]" />
                      </button>
                      <button className="cursor-pointer" onClick={() => handleDelete(material.id)} type="button" aria-label="Delete">
                        <Trash2 className="w-5 h-5 text-[#448C74]" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} handlePageChange={handlePageChange} />

        </div>
      </div>
      <AddReviewModal isOpen={openEditModal} onSubmit={() => setOpenEditModal(false)} onClose={() => setOpenEditModal(false)}  initialReviewType= "building-material-cost"  />

    </div>
  )
}
