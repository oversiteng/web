import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Oversite.ng Platform",
  description: "Next.js platform scaffold for AWS ECS Fargate",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
