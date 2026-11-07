import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { tasks, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";

function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// POST /api/v1/tasks/:id/arrive — Geofenced Site Arrival Check-In
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const { id: taskId } = await params;
      const body = await req.json();
      const { latitude, longitude, accuracy } = body;

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
            error: {
              code: "FORBIDDEN",
              message: "Only the assigned operative or Mission Control can check in at the site.",
            },
          },
          { status: 403 }
        );
      }

      let distanceMeters: number | null = null;
      const MAX_GEOFENCE_RADIUS_METERS = 500; // 500m geofence perimeter allowance for Nigerian cellular GPS drift

      if (task.locationLat && task.locationLng) {
        const targetLat = parseFloat(task.locationLat);
        const targetLng = parseFloat(task.locationLng);

        if (!isNaN(targetLat) && !isNaN(targetLng)) {
          distanceMeters = Math.round(
            haversineDistanceMeters(numLat, numLng, targetLat, targetLng)
          );

          if (distanceMeters > MAX_GEOFENCE_RADIUS_METERS && !isAdmin) {
            return NextResponse.json(
              {
                success: false,
                error: {
                  code: "GEOFENCE_VIOLATION",
                  message: `You are outside the verified site perimeter (distance: ${distanceMeters}m). Please approach within ${MAX_GEOFENCE_RADIUS_METERS}m to check in.`,
                },
                data: {
                  distanceMeters,
                  requiredRadiusMeters: MAX_GEOFENCE_RADIUS_METERS,
                },
              },
              { status: 400 }
            );
          }
        }
      }

      const now = new Date();
      const prevFormData = (task.formData as Record<string, any>) || {};

      const arrivalData = {
        latitude: numLat,
        longitude: numLng,
        accuracy: accuracy ? Number(accuracy) : null,
        distanceMeters,
        arrivedAt: now.toISOString(),
      };

      const [updatedTask] = await db
        .update(tasks)
        .set({
          status: "AGENT_ON_SITE",
          formData: {
            ...prevFormData,
            siteArrival: arrivalData,
          },
          updatedAt: now,
        })
        .where(eq(tasks.id, taskId))
        .returning();

      // Send institutional notification to User
      await db.insert(notifications).values({
        userId: task.userId,
        type: "TASK_UPDATE",
        title: "Operative On Site",
        body: `Your accredited Oversite field operative has arrived on site at "${task.title}".`,
        taskId: task.id,
      });

      return NextResponse.json<
        ApiResponse<{
          taskId: string;
          status: string;
          arrivedAt: string;
          distanceMeters: number | null;
        }>
      >({
        success: true,
        data: {
          taskId: updatedTask.id,
          status: updatedTask.status,
          arrivedAt: now.toISOString(),
          distanceMeters,
        },
        message: "Site arrival verified. Task status advanced to AGENT_ON_SITE.",
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
