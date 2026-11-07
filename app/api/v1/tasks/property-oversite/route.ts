import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { Task } from "@/lib/types/task";
import { getDbReady } from "@/lib/db/client";
import { tasks, properties } from "@/db/schema";
import { eq } from "drizzle-orm";
import { calculateTaskPricing } from "@/lib/services/pricing";

// POST /api/v1/tasks/property-oversite — Book physical property inspection & boundary audit
export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const {
      title,
      propertyId,
      locationAddress,
      locationLat,
      locationLng,
      perimeterScale = "standard", // "small" | "standard" | "large" | "estate"
      isExpress = false,
      inspectionType = "ROUTINE", // "ROUTINE" | "BOUNDARY_DISPUTE" | "ENCROACHMENT_CHECK" | "HANDOVER"
      checklist = [],
      formData,
    } = body;

    const taskTitle = title?.trim() || "Property Oversight & Site Inspection";

    const db = await getDbReady();

    let finalAddress = locationAddress;
    let finalLat = locationLat;
    let finalLng = locationLng;

    // Auto-inherit address and GPS from registered property if provided
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

    // Dynamic pricing calculation
    const quote = calculateTaskPricing({
      moduleType: "PROPERTY_OVERSITE",
      isExpress,
      perimeterScale,
    });

    const now = new Date();
    const deliveryDate = new Date(now.getTime() + quote.clientPromisedHours * 60 * 60 * 1000);

    const [newTask] = await db
      .insert(tasks)
      .values({
        userId: user.sub,
        propertyId: propertyId || null,
        moduleType: "PROPERTY_OVERSITE",
        status: "PENDING",
        priority: isExpress ? "urgent" : "normal",
        title: taskTitle,
        description: `Property Oversight Inspection | Scale: ${perimeterScale} | Type: ${inspectionType}`,
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
          perimeterScale,
          inspectionType,
          checklist,
          isExpress,
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
        message: "Property oversight mission booked successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    const errMessage = (error as Error).message || "";
    if (errMessage.includes("violates foreign key constraint") && errMessage.includes("user_id")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "User account associated with this session no longer exists in database. Please re-authenticate.",
          },
        },
        { status: 401 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: errMessage },
      },
      { status: 500 }
    );
  }
});
