// components/Chart/ReactApexChartClient.tsx
"use client"

import dynamic from "next/dynamic"

// Dynamically import with SSR disabled
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default ReactApexChart;
