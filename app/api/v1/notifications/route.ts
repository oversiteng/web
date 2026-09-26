import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";

export const GET = withAuth(async (req: NextRequest, { user }) => {
  // TODO: Fetch notifications for user.sub
  const mockNotifications = [
    {
      id: "00000000-0000-0000-0000-000000000080",
      type: "TASK_UPDATE",
      title: "Agent Assigned",
      body: "Agent Chukwudi has been assigned to your Quick Errand request.",
      isRead: false,
      createdAt: new Date().toISOString(),
    },
  ];

  return NextResponse.json<ApiResponse<typeof mockNotifications>>({
    success: true,
    data: mockNotifications,
  });
});

export const PATCH = withAuth(async (req: NextRequest, { user }) => {
  const body = await req.json();
  const { notificationIds, markAllAsRead } = body;

  // TODO: Update notifications in db

  return NextResponse.json<ApiResponse<{ updated: boolean }>>({
    success: true,
    data: { updated: true },
  });
});
