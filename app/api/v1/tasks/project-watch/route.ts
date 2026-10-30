import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { Task } from "@/lib/types/task";
import { getDbReady } from "@/lib/db/client";
import { tasks, taskMilestones, properties } from "@/db/schema";
import { eq } from "drizzle-orm";
import { calculateTaskPricing } from "@/lib/services/pricing";

// POST /api/v1/tasks/project-watch — Book ongoing construction / project monitoring
export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const {
      title,
      propertyId,
      locationAddress,
      locationLat,
      locationLng,
      projectStage = "FOUNDATION", // "FOUNDATION" | "LINTEL" | "ROOFING" | "FINISHING" | "RENOVATION"
      inspectionFrequency = "WEEKLY", // "ONCE" | "WEEKLY" | "BI_WEEKLY" | "MONTHLY"
      milestones = [],
      formData,
    } = body;

    const taskTitle = title?.trim() || `Project Watch: ${projectStage} Monitoring`;

    const db = await getDbReady();

    let finalAddress = locationAddress;
    let finalLat = locationLat;
    let finalLng = locationLng;

    if (propertyId && !finalAddress) {
      const linkedProps = await db
        .select()
        .from(properties)
        .where(eq(properties.id, propertyId))
        .limit(1);

      if (linkedProps.length > 0) {
        finalAddress = linkedProps[0].address;
        finalLat = linkedProps[0].latitude;
        finalLng = linkedProps[0].longitude;
      }
    }

    if (!finalAddress) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "locationAddress or valid propertyId is required." },
        },
        { status: 400 }
      );
    }

    const quote = calculateTaskPricing({
      moduleType: "PROJECT_WATCH",
      waypoints: [],
    });

    const now = new Date();
    const deliveryDate = new Date(now.getTime() + quote.clientPromisedHours * 60 * 60 * 1000);

    const [newTask] = await db
      .insert(tasks)
      .values({
        userId: user.sub,
        propertyId: propertyId || null,
        moduleType: "PROJECT_WATCH",
        status: "PENDING",
        priority: "normal",
        title: taskTitle,
        description: `Project Watch Stage: ${projectStage} | Frequency: ${inspectionFrequency}`,
        locationAddress: finalAddress,
        locationLat: finalLat ? String(finalLat) : null,
        locationLng: finalLng ? String(finalLng) : null,
        pricingMode: quote.pricingMode,
        quoteStatus: quote.requiresAdminQuote ? "PENDING_ADMIN_PRICE" : "ESTIMATED",
        agentTargetHours: quote.agentTargetHours,
        clientPromisedHours: quote.clientPromisedHours,
        clientPromisedDeliveryDate: deliveryDate,
        priceNgn: String(quote.totalNgn),
        pricingBreakdown: quote,
        formData: {
          projectStage,
          inspectionFrequency,
          milestones,
          ...formData,
        },
      })
      .returning();

    // Create initial milestones if provided
    if (Array.isArray(milestones) && milestones.length > 0) {
      for (const m of milestones) {
        const milestoneTitle = typeof m === "string" ? m : m.title || "Project Milestone";
        await db.insert(taskMilestones).values({
          taskId: newTask.id,
          title: milestoneTitle,
          status: "PENDING",
          completionPct: 0,
        });
      }
    }

    const createdTask: Task = {
      id: newTask.id,
      userId: newTask.userId,
      agentId: newTask.agentId,
      propertyId: newTask.propertyId,
      moduleType: newTask.moduleType as any,
      status: newTask.status as any,
      priority: newTask.priority,
      title: newTask.title,
      description: newTask.description,
      locationAddress: newTask.locationAddress,
      locationLat: newTask.locationLat ? parseFloat(newTask.locationLat) : undefined,
      locationLng: newTask.locationLng ? parseFloat(newTask.locationLng) : undefined,
      priceNgn: newTask.priceNgn ? parseFloat(newTask.priceNgn) : undefined,
      formData: newTask.formData as any,
      createdAt: newTask.createdAt.toISOString(),
      updatedAt: newTask.updatedAt ? newTask.updatedAt.toISOString() : undefined,
    };

    return NextResponse.json<ApiResponse<Task>>(
      {
        success: true,
        data: createdTask,
        message: "Project watch task scheduled successfully.",
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
