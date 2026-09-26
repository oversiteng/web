import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { Task, TaskModule, TaskStatus } from "@/lib/types/task";
import { getDb } from "@/lib/db/client";
import { tasks } from "@/db/schema";
import { eq } from "drizzle-orm";

const db = getDb();

export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, { params }) => {
    const { id } = await params;
    const dbTasks = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);

    if (dbTasks.length === 0) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Task not found" } }, { status: 404 });
    }

    const t = dbTasks[0];
    const taskData: Task = {
      ...t,
      moduleType: t.moduleType as TaskModule,
      status: t.status as TaskStatus,
      locationLat: t.locationLat ? parseFloat(t.locationLat) : undefined,
      locationLng: t.locationLng ? parseFloat(t.locationLng) : undefined,
      priceNgn: t.priceNgn ? parseFloat(t.priceNgn) : undefined,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };

    return NextResponse.json<ApiResponse<Task>>({
      success: true,
      data: taskData,
    });
  }
);

export const PATCH = withAuth<{ id: string }>(
  async (req: NextRequest, { params }) => {
    const { id } = await params;
    const body = await req.json();
    
    await db.update(tasks).set({
      ...body,
      updatedAt: new Date(),
    }).where(eq(tasks.id, id));

    return NextResponse.json<ApiResponse<{ updated: boolean }>>({
      success: true,
      data: { updated: true },
    });
  }
);
