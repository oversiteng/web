"use client"

import { GlobalMap } from "@/app/components/dashboard/global-map"
import { Header } from "@/app/components/dashboard/header"
import { MarketingBanner } from "@/app/components/dashboard/marketing-banner"
import { PropertyChart } from "@/app/components/dashboard/property-chart"
import { PropertyDetails } from "@/app/components/dashboard/property-details"
import { Sidebar } from "@/app/components/dashboard/sidebar"
import { useLayoutContext } from "@/app/ProviderLayout"
import { useState } from "react"

export default function PropertyPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user } = useLayoutContext();
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
        <Header onMenuClick={() => setIsMobileMenuOpen(true)} isMobile={true} user={user} />

        <main className="flex-1 overflow-auto p-4 lg:p-6 flex flex-col gap-8">
          <PropertyDetails propertyName="GreenLand Estate" />
          <PropertyChart />
          <MarketingBanner />
          <GlobalMap />
        </main>
      </div>
    </div>
  )
}
