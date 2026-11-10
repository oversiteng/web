"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AuthCarousel from "@/components/AuthCarousel";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show carousel on all login and register pages
  const showCarousel = pathname.startsWith("/login") || pathname.startsWith("/register");

  return (
    <div className="min-h-screen bg-[#FDFDFD] dark:bg-[var(--bg-body)] text-[var(--text-body)] font-sans flex transition-colors duration-300 relative overflow-hidden">
      {/* Background Watermark */}
      <div
        className="absolute top-[5%] sm:top-[10%] right-14 w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] opacity-[0.20] dark:opacity-[0.15] pointer-events-none transform translate-x-[40%]"
        style={{
          backgroundColor: 'var(--primary)',
          maskImage: 'url(/assets/nav-icons/logo.svg)',
          maskSize: 'contain',
          maskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskImage: 'url(/assets/nav-icons/logo.svg)',
          WebkitMaskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center'
        }}
      />

      {/* Left Column: Carousel (Desktop only) */}
      {showCarousel && (
        <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
          <AuthCarousel />
        </div>
      )}

      {/* Right Column: Auth Forms */}
      <div className={`w-full flex flex-col items-center justify-start pt-12 sm:pt-0 sm:justify-center py-6 px-6 ${showCarousel ? 'lg:w-1/2' : ''}`}>
        <div className="w-full max-w-md sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
