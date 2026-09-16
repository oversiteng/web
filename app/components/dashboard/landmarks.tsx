"use client"

import type React from "react"

import { useState } from "react"
import { Search, SlidersHorizontal } from "lucide-react"
import { BackNavButton } from "../backNavButton"

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



  const handleFiltersClick = () => {
    console.log("Filters clicked")
  }


  return (
    <div className="min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <BackNavButton />
          <nav className="text-sm text-[#7E838D]">
            <span>My Properties</span>
            <span className="mx-2">/</span>
            <span className="max-w-[70px] truncate inline-block align-bottom" title="GreenLand Estate">
              GreenLand Estate
            </span>
            <span className="mx-2">/</span>
            <span className="max-w-[160px] truncate inline-block align-bottom text-[#212A3B]" title="Estimated Property Value" >Landmarks</span>
          </nav>
        </div>
      </div>

      <div className="py-4 md:py-6 flex flex-col gap-4">
        {/* Property Title */}
        <h1 className="text-[1.313rem] font-medium text-[#212A3B] mb-6">GreenLand Estate</h1>
        {/* Landmarks Section */}
        <div className="bg-white border border-[#E9EAEB] rounded-2xl shadow-sm shadow-[#1E1E1E05] py-[0.875rem] px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-[1.313rem] font-medium text-[#212A3B]">Landmarks</h2>
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
          <div className="overflow-x-auto">
            <table className="w-full h-full min-w-260">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-[1.125rem]  min-h-15 text-base font-medium text-[#7E838D]">Name</th>
                  <th className="text-left py-[1.125rem]  min-h-15 text-base font-medium text-[#7E838D]">Distance & Est. Time</th>
                  <th className="text-left py-[1.125rem]  min-h-15 text-base font-medium text-[#7E838D]">Interesting Feature</th>
                  <th className="text-left py-[1.125rem]  min-h-15 text-base font-medium text-[#7E838D]">Added on</th>
                  {/* <th className="text-left py-[1.125rem]  min-h-15 text-base font-medium text-[#7E838D]">Listing Images</th> */}
                </tr> '
              </thead>
              <tbody>
                {filteredMaterials.map((material) => (
                  <tr key={material.id} className="hover:bg-gray-50">
                    <td className="py-[1.125rem] min-h-15 text-base font-normal text-[#212A3B]">{material.name}</td>
                    <td className="py-[1.125rem] min-h-15 text-base font-normal text-[#212A3B]">{material.dist_est_time}</td>
                    <td className="py-[1.125rem] min-h-15 text-base font-normal text-[#212A3B]">{material.feats}</td>
                    <td className="py-[1.125rem] min-h-15 text-base font-normal text-[#212A3B]">{material.dateAdded}</td>
                    {/* <td className="py-[1.125rem] min-h-15 text-base font-normal text-[#212A3B]">	<button
                      className="text-[#306251] text-sm font-medium h-10 w-[6.938rem] bg-[#FFFFFF] border border-[#D0D5DD] hover:bg-[#E9EAEB] rounded-lg flex items-center justify-center">
                      View Image
                    </button></td> */}
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
/* 

  <button onClick={() => handleViewDetails(property.id)}
  <button 
                        className="text-[#306251] text-sm font-medium h-10 w-[6.938rem] bg-[#FFFFFF] border border-[#D0D5DD] hover:bg-[#E9EAEB] rounded-lg flex items-center justify-center">
                        View Details
                      </button> */
