import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDb } from "@/lib/db/client";
import { notifications } from "@/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";

const db = getDb();

export interface FormattedNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  taskId?: string | null;
  metadata?: any;
  createdAt: string;
}

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const searchParams = req.nextUrl.searchParams;
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  const dbNotifs = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.sub))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);

  const formatted: FormattedNotification[] = dbNotifs.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    isRead: n.isRead,
    taskId: n.taskId,
    metadata: n.metadata,
    createdAt: n.createdAt.toISOString(),
  }));

  return NextResponse.json<ApiResponse<FormattedNotification[]>>({
    success: true,
    data: formatted,
  });
});

export const PATCH = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const { notificationIds, markAllAsRead } = body;

    if (markAllAsRead) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, user.sub));
    } else if (Array.isArray(notificationIds) && notificationIds.length > 0) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.userId, user.sub),
            inArray(notifications.id, notificationIds)
          )
        );
    }

    return NextResponse.json<ApiResponse<{ updated: boolean }>>({
      success: true,
      data: { updated: true },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: (error as Error).message },
      },
      { status: 500 }
    );
  }
});
