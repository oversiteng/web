import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { tasks, agentProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { RedisSocketBridge } from "@/lib/realtime/websocketHandlers";

const bridge = new RedisSocketBridge();

// POST /api/v1/tasks/:id/location — Stream operative real-time GPS telemetry
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const { id: taskId } = await params;
      const body = await req.json();
      const { latitude, longitude, accuracy, heading, speed } = body;

      if (
        latitude === undefined ||
        longitude === undefined ||
        isNaN(Number(latitude)) ||
        isNaN(Number(longitude))
      ) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "latitude and longitude are required numbers.",
            },
          },
          { status: 400 }
        );
      }

      const numLat = Number(latitude);
      const numLng = Number(longitude);

      if (numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Coordinates out of bounds (-90 <= lat <= 90, -180 <= lng <= 180).",
            },
          },
          { status: 400 }
        );
      }

      const db = await getDbReady();
      const existingTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, taskId))
        .limit(1);

      if (existingTasks.length === 0) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Task not found." } },
          { status: 404 }
        );
      }

      const task = existingTasks[0];
      const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user.role);
      const isAssignedAgent = task.agentId === user.sub;

      if (!isAdmin && !isAssignedAgent) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "FORBIDDEN", message: "Only the assigned operative or Mission Control can publish telemetry." },
          },
          { status: 403 }
        );
      }

      const now = new Date();
      const locationPayload = {
        latitude: numLat,
        longitude: numLng,
        accuracy: accuracy ? Number(accuracy) : null,
        heading: heading !== undefined ? Number(heading) : null,
        speed: speed !== undefined ? Number(speed) : null,
        timestamp: now.toISOString(),
      };

      // Update agent profile current coordinates
      if (user.role === "AGENT") {
        await db
          .update(agentProfiles)
          .set({
            serviceAreaLat: String(numLat),
            serviceAreaLng: String(numLng),
            updatedAt: now,
          })
          .where(eq(agentProfiles.userId, user.sub));
      }

      // Record latest telemetry point in task formData
      const prevFormData = (task.formData as Record<string, any>) || {};
      await db
        .update(tasks)
        .set({
          formData: {
            ...prevFormData,
            lastTelemetry: locationPayload,
          },
          updatedAt: now,
        })
        .where(eq(tasks.id, taskId));

      // Broadcast real-time telemetry over Redis pub/sub channel
      try {
        await bridge.publish({
          channel: `task:${taskId}`,
          event: "agent:location",
          payload: {
            taskId,
            agentId: user.sub,
            ...locationPayload,
          },
        });
      } catch (bridgeErr) {
        // Fallback silently if redis server is in local mock mode
      }

      return NextResponse.json<ApiResponse<typeof locationPayload>>({
        success: true,
        data: locationPayload,
        message: "Telemetry updated successfully.",
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
  },
  { roles: ["AGENT", "ADMIN", "SUPER_ADMIN"] }
);

