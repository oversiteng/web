import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";

export const GET = withAuth(async (req: NextRequest, { user }) => {
  // TODO: Fetch all active chat threads for this user/agent
  const mockThreads = [
    {
      taskId: "00000000-0000-0000-0000-000000000020",
      taskTitle: "Perimeter Inspection",
      lastMessage: "Agent has arrived on site.",
      lastMessageAt: new Date().toISOString(),
      unreadCount: 1,
    },
  ];

  return NextResponse.json<ApiResponse<typeof mockThreads>>({
    success: true,
    data: mockThreads,
  });
});
