import type { Metadata } from "next";
import "./globals.css";
import "@/app/assets/icons/around-icons.min.css";

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

import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,300,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider attribute="data-theme" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
