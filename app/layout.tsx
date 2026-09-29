import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
    <html lang="en" data-theme="light" suppressHydrationWarning className={`${inter.variable}`}>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,300,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
