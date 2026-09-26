import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";

export const GET = withAuth(async (req: NextRequest) => {
  // TODO: Search agents with tier = 'LEGAL_COUNSEL' and verified NBA number
  const mockLawyers = [
    {
      id: "00000000-0000-0000-0000-000000000095",
      name: "Barrister Adebayo Adeleke",
      nbaNumber: "NBA/LAG/2014/0982",
      rating: 4.95,
      specialization: "Land Title & Real Estate Litigation",
      hourlyRateNgn: 40000,
      isAvailable: true,
    },
  ];

  return NextResponse.json<ApiResponse<typeof mockLawyers>>({
    success: true,
    data: mockLawyers,
  });
});
