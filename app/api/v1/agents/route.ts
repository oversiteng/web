import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { PaginatedResponse } from "@/lib/types/api";
import { AgentProfile } from "@/lib/types/user";

export const GET = withAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const tier = searchParams.get("tier");
  const availableOnly = searchParams.get("available") === "true";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  // TODO: Query db for agents matching tier and geographic proximity
  const mockAgents: AgentProfile[] = [];

  return NextResponse.json<PaginatedResponse<AgentProfile>>({
    success: true,
    data: mockAgents,
    pagination: {
      page,
      limit,
      total: 0,
      totalPages: 0,
    },
  });
});
