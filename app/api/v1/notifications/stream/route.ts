import { NextRequest, NextResponse } from "next/server";
import { verifyToken, JwtPayload } from "@/lib/auth/jwt";
import { extractBearerToken } from "@/lib/auth/middleware";
import { getDbReady } from "@/lib/db/client";
import { notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { realtimeBridge } from "@/lib/realtime/websocketHandlers";

export const runtime = "nodejs";

/**
 * GET /api/v1/notifications/stream
 * Real-time SSE (Server-Sent Events) Notification Adapter for Web & Mobile clients.
 * Accepts Authorization: Bearer <token>, token cookie, or ?token=<jwt>.
 */
export async function GET(req: NextRequest) {
  try {
    let token = extractBearerToken(req);
    if (!token) {
      token = req.nextUrl.searchParams.get("token");
    }

    if (!token) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = verifyToken<JwtPayload>(token);
    if (!user?.sub) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const db = await getDbReady();
    const unreadRows = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(eq(notifications.userId, user.sub), eq(notifications.isRead, false))
      );

    const encoder = new TextEncoder();
    let cleanupSubscription: (() => Promise<void> | void) | null = null;
    let heartbeatTimer: NodeJS.Timeout | null = null;

    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(
          encoder.encode(
            `event: connected\ndata: ${JSON.stringify({
              userId: user.sub,
              unreadCount: unreadRows.length,
              channel: `notifications:user:${user.sub}`,
            })}\n\n`
          )
        );

        cleanupSubscription = await realtimeBridge.subscribe(
          `notifications:user:${user.sub}`,
          (event) => {
            try {
              controller.enqueue(
                encoder.encode(
                  `event: ${event.event}\ndata: ${JSON.stringify(
                    event.payload
                  )}\n\n`
                )
              );
            } catch (err) {
              console.error("[Notifications SSE] Enqueue error:", err);
            }
          }
        );

        heartbeatTimer = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`: ping\n\n`));
          } catch {
            if (heartbeatTimer) clearInterval(heartbeatTimer);
          }
        }, 15000);
      },
      cancel() {
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        if (cleanupSubscription) cleanupSubscription();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("[Notifications SSE] Handler error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

