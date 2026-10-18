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
    const { legalDomain, serviceType, caseSummary, title, priceNgn, propertyId, formData } = body;

    const taskTitle = title || (legalDomain && serviceType ? `${legalDomain} - ${serviceType}` : "Legal Advisory Consultation");

    const [newTask] = await db
      .insert(tasks)
      .values({
        userId: user.sub,
        propertyId: propertyId || null,
        moduleType: "LEGAL_ADVISORY",
        status: "PENDING",
        priority: "high",
        title: taskTitle,
        description: caseSummary || null,
        formData: {
          legalDomain,
          serviceType,
          caseSummary,
          ...(formData || {}),
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
