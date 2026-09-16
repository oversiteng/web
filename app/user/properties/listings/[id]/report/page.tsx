"use client"

import { Header } from "@/app/components/dashboard/header"
import { PropertyDetails } from "@/app/components/dashboard/property-details"
import { PropertyDocuments } from "@/app/components/dashboard/property-documents"
import { Sidebar } from "@/app/components/dashboard/sidebar"
import { Filter } from "lucide-react"
import { use, useState } from "react"

interface PropertyPageProps {
  params: Promise<{
    id: string
  }>
}

export default function PropertyPage({ params }: PropertyPageProps) {
  const { id } = use(params)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden lg:block" />

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <Sidebar className="relative z-50" onClose={() => setIsMobileMenuOpen(false)} showCloseButton={true} />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setIsMobileMenuOpen(true)} isMobile={true} />

        <main className="flex-1 overflow-auto p-4 lg:p-6">

          <PropertyDocuments propertyName="GreenLand Estate" />
        </main>
      </div>
    </div>
  )
}
