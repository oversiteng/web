import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Oversite.ng | Monitoring Properties and Building Projects",
  description:
    "Monitor properties and building projects remotely with clear, verified updates.",
  keywords: [
    "properties",
    "projects",
    "oversight",
    "remote monitoring",
    "real estate",
    "building projects",
    "diaspora",
    "verify",
  ],
  authors: [{ name: "Oversite.ng" }],
  icons: {
    icon: "/file.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data - theme= "light" suppressHydrationWarning >
      <body className={inter.className} > {children}</body >
            </html >
  );
}
