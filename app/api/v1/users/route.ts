import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { PaginatedResponse } from "@/lib/types/api";
import { User } from "@/lib/types/user";

export const GET = withAuth(
  async (req: NextRequest) => {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    // TODO: Query db for users list with pagination
    const mockUsers: Partial<User>[] = [];

    return NextResponse.json<PaginatedResponse<Partial<User>>>({
      success: true,
      data: mockUsers,
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    });
  },
  { roles: ["ADMIN"] }
);
