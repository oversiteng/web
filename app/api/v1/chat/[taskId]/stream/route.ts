import { NextRequest, NextResponse } from "next/server";
import { verifyToken, JwtPayload } from "@/lib/auth/jwt";
import { extractBearerToken } from "@/lib/auth/middleware";
import { getDbReady } from "@/lib/db/client";
import { tasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { realtimeBridge } from "@/lib/realtime/websocketHandlers";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;

    // Extract auth token from header, cookie, or query parameter (?token=...)
    let token = extractBearerToken(req);
    if (!token) {
      token = req.nextUrl.searchParams.get("token");
    }

    if (!token) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = verifyToken<JwtPayload>(token);
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const db = await getDbReady();
    const existingTasks = await db
      .select({ id: tasks.id, userId: tasks.userId, agentId: tasks.agentId, moduleType: tasks.moduleType })
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (existingTasks.length === 0) {
      return new NextResponse("Task not found", { status: 404 });
    }

    const task = existingTasks[0];
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user.role);
    const isOwner = task.userId === user.sub;
    const isAssignedAgent = task.agentId === user.sub;

    if (!isAdmin && !isOwner && !isAssignedAgent) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Set up Server-Sent Events Stream
    const encoder = new TextEncoder();
    let cleanupSubscription: (() => Promise<void> | void) | null = null;
    let heartbeatTimer: NodeJS.Timeout | null = null;

    const stream = new ReadableStream({
      async start(controller) {
        // Send initial connected event
        controller.enqueue(
          encoder.encode(`event: connected\ndata: ${JSON.stringify({ taskId, userId: user.sub })}\n\n`)
        );

        // Subscribe to real-time events for this task chat channel
        cleanupSubscription = await realtimeBridge.subscribe(
          `task:chat:${taskId}`,
          (event) => {
            try {
              controller.enqueue(
                encoder.encode(`event: ${event.event}\ndata: ${JSON.stringify(event.payload)}\n\n`)
              );
            } catch (err) {
              console.error("[SSE Stream] Enqueue error:", err);
            }
          }
        );

        // 15-second heartbeat to keep connection alive through Nginx/AWS proxies
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
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("[SSE Stream] Handler error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

