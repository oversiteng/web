import { NextRequest } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { realtimeBridge } from "@/lib/realtime/websocketHandlers";

export const dynamic = "force-dynamic";

// GET /api/v1/admin/chats/stream — Live SSE stream for Admin Hub-and-Spoke chat moderation
export const GET = withAuth(
  async (req: NextRequest) => {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          try {
            controller.enqueue(
              encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
            );
          } catch {
            // Stream already closed
          }
        };

        send("connected", { channel: "admin:chat:moderation", timestamp: new Date().toISOString() });

        const unsubscribe = await realtimeBridge.subscribe(
          "admin:chat:moderation",
          (evt) => {
            send(evt.event || "message", evt.payload);
          }
        );

        const heartbeat = setInterval(() => {
          send("heartbeat", { ts: Date.now() });
        }, 25000);

        req.signal.addEventListener("abort", async () => {
          clearInterval(heartbeat);
          await unsubscribe();
          try {
            controller.close();
          } catch {}
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  },
  { roles: ["ADMIN", "SUPER_ADMIN"] }
);

