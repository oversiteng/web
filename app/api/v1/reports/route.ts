import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { PaginatedResponse } from "@/lib/types/api";
import { TaskReport } from "@/lib/types/task";

export const GET = withAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get("status");
  const taskId = searchParams.get("taskId");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  // TODO: Query reports with filtering
  const mockReports: TaskReport[] = [];

  return NextResponse.json<PaginatedResponse<TaskReport>>({
    success: true,
    data: mockReports,
    pagination: {
      page,
      limit,
      total: 0,
      totalPages: 0,
    },
  });
});
