"use client"
import { Header } from "@/app/components/dashboard/header";
import { PropertyForm } from "@/app/components/dashboard/property-form";
import { Sidebar } from "@/app/components/dashboard/sidebar";
import { useLayoutContext } from "@/app/ProviderLayout";

export default function NewPropertyPage() {
  const { user } = useLayoutContext()
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden lg:block" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden" >
        <Header isMobile={true} user={user} />

        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <PropertyForm />
        </main>
      </div>
    </div>
  )
}
