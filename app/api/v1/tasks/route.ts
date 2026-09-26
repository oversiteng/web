import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse, PaginatedResponse } from "@/lib/types/api";
import { Task, TaskModule, TaskStatus } from "@/lib/types/task";
import { getDb } from "@/lib/db/client";
import { tasks } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const db = getDb();

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const searchParams = req.nextUrl.searchParams;
  const moduleType = searchParams.get("module") as TaskModule | null;
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  let conditions = undefined;
  if (user.role === "USER") {
    conditions = eq(tasks.userId, user.sub);
  } else if (user.role === "AGENT") {
    conditions = eq(tasks.agentId, user.sub);
  }

  // Handle module and status filters if provided (for simplicity, only adding role filter here, can extend later)
  const dbTasks = await db.select().from(tasks).where(conditions).limit(limit).offset((page - 1) * limit);

  const mappedTasks: Task[] = dbTasks.map((t) => ({
    ...t,
    moduleType: t.moduleType as TaskModule,
    status: t.status as TaskStatus,
    locationLat: t.locationLat ? parseFloat(t.locationLat) : undefined,
    locationLng: t.locationLng ? parseFloat(t.locationLng) : undefined,
    priceNgn: t.priceNgn ? parseFloat(t.priceNgn) : undefined,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  return NextResponse.json<PaginatedResponse<Task>>({
    success: true,
    data: mappedTasks,
    pagination: {
      page,
      limit,
      total: mappedTasks.length,
      totalPages: 1,
    },
  });
});

export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const { moduleType, title, description, locationAddress, locationLat, locationLng, propertyId, priceNgn, formData } = body;

    if (!moduleType || !title) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Module type and title are required" },
        },
        { status: 400 }
      );
    }

    const [newTask] = await db.insert(tasks).values({
      userId: user.sub,
      moduleType,
      status: "PENDING",
      priority: "normal",
      title,
      description,
      locationAddress,
      locationLat,
      locationLng,
      propertyId,
      formData,
      priceNgn: priceNgn || 15000,
    }).returning();

    const createdTask: Task = {
      ...newTask,
      moduleType: newTask.moduleType as TaskModule,
      status: newTask.status as TaskStatus,
      locationLat: newTask.locationLat ? parseFloat(newTask.locationLat) : undefined,
      locationLng: newTask.locationLng ? parseFloat(newTask.locationLng) : undefined,
      priceNgn: newTask.priceNgn ? parseFloat(newTask.priceNgn) : undefined,
      createdAt: newTask.createdAt.toISOString(),
      updatedAt: newTask.updatedAt.toISOString(),
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
