import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { Task, TaskModule, TaskStatus } from "@/lib/types/task";
import { getDb } from "@/lib/db/client";
import { tasks } from "@/db/schema";

const db = getDb();

export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const { categoryId, location, timeWindow, instructions, priceNgn, propertyId } = body;

    if (!location && !instructions) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Location and instructions are required for quick errands",
          },
        },
        { status: 400 }
      );
    }

    const title = instructions
      ? instructions.slice(0, 80)
      : "Quick Errand Task";

    const [newTask] = await db
      .insert(tasks)
      .values({
        userId: user.sub,
        propertyId: propertyId || null,
        moduleType: "QUICK_ERRANDS",
        status: "PENDING",
        priority: "normal",
        title,
        description: instructions || null,
        locationAddress: typeof location === "string" ? location : location?.address || null,
        locationLat: location?.latitude ? String(location.latitude) : null,
        locationLng: location?.longitude ? String(location.longitude) : null,
        formData: {
          categoryId,
          timeWindow,
          instructions,
        },
        priceNgn: priceNgn || 15000,
      })
      .returning();

    const createdTask: Task = {
      ...newTask,
      moduleType: newTask.moduleType as TaskModule,
      status: newTask.status as TaskStatus,
      priority: newTask.priority ?? "normal",
      formData: (newTask.formData as Record<string, unknown>) ?? null,
      locationLat: newTask.locationLat ? parseFloat(newTask.locationLat) : undefined,
      locationLng: newTask.locationLng ? parseFloat(newTask.locationLng) : undefined,
      priceNgn: newTask.priceNgn ? parseFloat(newTask.priceNgn) : undefined,
      scheduledAt: newTask.scheduledAt ? newTask.scheduledAt.toISOString() : null,
      completedAt: newTask.completedAt ? newTask.completedAt.toISOString() : null,
      createdAt: newTask.createdAt.toISOString(),
      updatedAt: newTask.updatedAt ? newTask.updatedAt.toISOString() : undefined,
    };

    return NextResponse.json<ApiResponse<Task>>(
      {
        success: true,
        data: createdTask,
      },
      { status: 201 }
    );
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