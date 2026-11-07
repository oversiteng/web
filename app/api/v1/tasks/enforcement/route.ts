import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { Task } from "@/lib/types/task";
import { getDbReady } from "@/lib/db/client";
import { tasks, properties } from "@/db/schema";
import { eq } from "drizzle-orm";
import { calculateTaskPricing } from "@/lib/services/pricing";

// POST /api/v1/tasks/enforcement — Emergency Law Enforcement Liaison & Rapid Security Dispatch
export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const {
      agency = "LSSOES",
      incidentType = "Encroachment",
      locationAddress,
      locationLat,
      locationLng,
      propertyId,
      urgency = "EMERGENCY",
      title,
      description,
      formData,
    } = body;

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
          error: { code: "VALIDATION_ERROR", message: "locationAddress is required for emergency enforcement dispatch." },
        },
        { status: 400 }
      );
    }

    const taskTitle = title?.trim() || `Security Enforcement: ${incidentType} (${agency})`;

    const quote = calculateTaskPricing({
      moduleType: "LAW_ENFORCEMENT",
      isExpress: true,
    });

    const now = new Date();
    // 2-hour SLA for emergency dispatch
    const deliveryDate = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const [newTask] = await db
      .insert(tasks)
      .values({
        userId: user.sub,
        propertyId: propertyId || null,
        moduleType: "LAW_ENFORCEMENT",
        status: "PENDING",
        priority: "urgent",
        title: taskTitle,
        description: description || `Emergency Liaison: ${incidentType} via ${agency} | 2-Hour SLA Response`,
        locationAddress: finalAddress,
        locationLat: finalLat ? String(finalLat) : null,
        locationLng: finalLng ? String(finalLng) : null,
        pricingMode: "FIXED_TIER",
        quoteStatus: "ESTIMATED",
        agentTargetHours: 2,
        clientPromisedHours: 2,
        clientPromisedDeliveryDate: deliveryDate,
        priceNgn: String(quote.totalNgn || 75000),
        pricingBreakdown: quote,
        formData: {
          agency,
          incidentType,
          urgency,
          slaHours: 2,
          ...formData,
        },
      })
      .returning();

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
        message: "Enforcement liaison dispatch activated with 2-hour SLA guarantee.",
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
