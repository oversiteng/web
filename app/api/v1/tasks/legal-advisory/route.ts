import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { Task, TaskModule, TaskStatus } from "@/lib/types/task";
import { getDb } from "@/lib/db/client";
import { tasks } from "@/db/schema";

const db = getDb();

function isValidUuid(id?: string | null): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const {
      legalDomain,
      legalType,
      serviceType,
      caseSummary,
      title,
      priceNgn,
      propertyId,
      formData,
    } = body;

    const domain = legalDomain || formData?.legalDomain || "Property & Land Law";
    const service = serviceType || formData?.serviceType || "Advice/opinion";
    const entityType = legalType || formData?.legalType || "Individual";
    const summary = caseSummary || formData?.caseSummary || null;

    const taskTitle =
      title || (domain && service ? `${domain} - ${service}` : "Legal Advisory Consultation");

    // Optional parse for scheduled consultation date
    const dateInput = formData?.consultationDate || formData?.consultationDateRaw;
    let scheduledDate: Date | null = null;
    if (dateInput) {
      const parsed = new Date(dateInput);
      if (!isNaN(parsed.getTime())) {
        scheduledDate = parsed;
      }
    }

    const consentData = formData?.consent || formData?.declaration || null;

    const workloadUnits = formData?.workloadUnits ?? 2;
    const serviceFee = workloadUnits * 11000;
    const documentReviewBase = 4000;
    const charge = 100;
    const calculatedTotal = serviceFee + documentReviewBase + charge;
    const finalPrice = priceNgn || calculatedTotal;

    const breakdown = formData?.pricingBreakdown || {
      serviceFee,
      workloadUnits,
      documentReviewBase,
      charge,
      totalAmount: finalPrice,
    };

    const [newTask] = await db
      .insert(tasks)
      .values({
        userId: user.sub,
        propertyId: isValidUuid(propertyId) ? propertyId : null,
        moduleType: "LEGAL_ADVISORY",
        status: "PENDING",
        priority: "high",
        title: taskTitle,
        description: summary,
        scheduledAt: scheduledDate,
        formData: {
          legalDomain: domain,
          legalType: entityType,
          serviceType: service,
          caseSummary: summary,
          consultationDate: formData?.consultationDate || null,
          fileName: formData?.fileName || null,
          workloadUnits,
          pricingBreakdown: breakdown,
          consent: consentData,
          declaration: consentData,
          ...(formData || {}),
        },
        pricingBreakdown: breakdown,
        priceNgn: finalPrice,
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
  } catch (error: any) {
    const fullErrorStr = `${error?.message || ""} ${error?.cause?.message || ""} ${error?.cause?.detail || ""}`;
    const errCode = error?.code || error?.cause?.code;

    if (errCode === "23503" || fullErrorStr.includes("foreign key constraint") || fullErrorStr.includes("tasks_user_id_users_id_fk")) {
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
        error: { code: "INTERNAL_ERROR", message: error?.message || String(error) },
      },
      { status: 500 }
    );
  }
});
