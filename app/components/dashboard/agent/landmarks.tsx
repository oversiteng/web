"use client"

import type React from "react"

import { useState } from "react"
import { Trash2, Pen, Search, SlidersHorizontal } from "lucide-react"
import OverviewTab from "./overviewTap"
import { AddReviewModal } from "../admin/add-review-modal"
import { Pagination } from "../../pagination"
import { OverViewBreadCrumbs } from "./breadcrumb"

interface BuildingMaterial {
  id: string
  name: string
  dist_est_time: string
  feats: string
  dateAdded: string
}

interface BuildingMaterialCostProps {
  isMobile?: boolean
}

const buildingMaterials: BuildingMaterial[] = [
  {
    id: "1",
    name: "Lagos State Secretariat Complex",
    dist_est_time: "1.2 km / 5 mins	",
    feats: "Modernist government architecture	",
    dateAdded: "July 21, 2023",
  },
  {
    id: "2",
    name: "Lagos State Secretariat Complex",
    dist_est_time: "1.2 km / 5 mins	",
    feats: "Modernist government architecture	",
    dateAdded: "July 21, 2023",
  },
  {
    id: "3",
    name: "Lagos State Secretariat Complex",
    dist_est_time: "1.2 km / 5 mins	",
    feats: "Modernist government architecture	",
    dateAdded: "July 21, 2023",
  },
  {
    id: "4",
    name: "Lagos State Secretariat Complex",
    dist_est_time: "1.2 km / 5 mins	",
    feats: "Modernist government architecture	",
    dateAdded: "July 21, 2023",
  },
  {
    id: "5",
    name: "Lagos State Secretariat Complex",
    dist_est_time: "1.2 km / 5 mins	",
    feats: "Modernist government architecture	",
    dateAdded: "July 21, 2023",
  },
]

export default function Landmarks({ isMobile = false }: BuildingMaterialCostProps) {
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleFiltersClick = () => {
    console.log("Filters clicked")
  }

  const handleEdit = (id: string) => {
    setOpenEditModal(true)
  }

  const handleDelete = (id: string) => {
    setFilteredMaterials((prev) => prev.filter((material) => material.id !== id));
  };
  return (
    <div className="min-h-screen">
      <OverViewBreadCrumbs property={"GreenLand Estate"} page={"Building Material Cost"} switchModal={"landmarks"} />

      <div className="py-4 md:py-6 flex flex-col gap-4">
        {/* Property Title */}
        <div className="md:hidden block">
          <OverviewTab />
        </div>
        <h1 className="text-[1.313rem] font-medium text-[#212A3B] mb-6">GreenLand Estate</h1>
        <div className="md:hidden flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={handleSearch}
              className="w-full max-w-[23.875rem] pl-10 pr-4 py-2 border border-gray-300 bg-[#F6F9FC] text-[#212A3B] placeholder:text-[#A4A8AF] rounded-[3.625rem] focus:outline-none  focus:border-transparent"
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
        {/* Landmarks Section */}
        <div className="bg-white border border-[#E9EAEB] rounded-2xl shadow-sm shadow-[#1E1E1E05] py-[0.875rem] px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-[1.313rem] font-medium text-[#212A3B]">Landmarks</h2>
              <span className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-600 text-base font-normal rounded-full">
                {buildingMaterials.length}
              </span>
            </div>
            <div className="md:flex hidden items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full max-w-[23.875rem] pl-10 pr-4 py-2 border border-gray-300 bg-[#F6F9FC] text-[#212A3B] placeholder:text-[#A4A8AF] rounded-[3.625rem] focus:outline-none  focus:border-transparent"
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
          <div className="md:block hidden overflow-x-auto">
            <table className="w-full h-full min-w-260">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-[1.125rem]  min-h-15 text-base font-medium text-[#7E838D]">Name</th>
                  <th className="text-left py-[1.125rem]  min-h-15 text-base font-medium text-[#7E838D]">Distance & Est. Time</th>
                  <th className="text-left py-[1.125rem]  min-h-15 text-base font-medium text-[#7E838D]">Interesting Feature</th>
                  <th className="text-left py-[1.125rem]  min-h-15 text-base font-medium text-[#7E838D]">Added on</th>
                  <th className="text-left py-[1.125rem]  min-h-15 text-base font-medium text-[#7E838D]"></th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterials.map((material) => (
                  <tr key={material.id} className="hover:bg-gray-50">
                    <td className="py-[1.125rem] min-h-15 text-base font-normal text-[#212A3B]">{material.name}</td>
                    <td className="py-[1.125rem] min-h-15 text-base font-normal text-[#212A3B]">{material.dist_est_time}</td>
                    <td className="py-[1.125rem] min-h-15 text-base font-normal text-[#212A3B]">{material.feats}</td>
                    <td className="py-[1.125rem] min-h-15 text-base font-normal text-[#212A3B]">{material.dateAdded}</td>
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
                    <span className="text-sm text-[#7E838D]">Distance & Est. Time</span>
                    <span className="text-[#474E5C] text-sm">{material.dist_est_time}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-[#7E838D]">Interesting Feature</span>
                    <span className="text-[#474E5C] text-sm">{material.feats}</span>
                  </div>

                  <div className="flex justify-between items-start">
                    <div className="pt-3 flex align-center justify-center gap-2">
                      <span className="text-sm text-[#7E838D]">Updated</span>
                      <span className="text-[#474E5C] text-sm">{material.dateAdded}</span>
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
      <AddReviewModal isOpen={openEditModal} onSubmit={() => setOpenEditModal(false)} onClose={() => setOpenEditModal(false)} initialReviewType="landmarks" />
    </div>
  )
}
/* 

  <button onClick={() => handleViewDetails(property.id)}
  <button 
                        className="text-[#306251] text-sm font-medium h-10 w-[6.938rem] bg-[#FFFFFF] border border-[#D0D5DD] hover:bg-[#E9EAEB] rounded-lg flex items-center justify-center">
                        View Details
                      </button> */
