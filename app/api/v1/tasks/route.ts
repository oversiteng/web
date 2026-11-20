import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse, PaginatedResponse } from "@/lib/types/api";
import { Task, TaskModule, TaskStatus } from "@/lib/types/task";
import { getDbReady } from "@/lib/db/client";
import { tasks, properties, users, payments } from "@/db/schema";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import {
  calculateTaskPricing,
  resolveTaskDualPricing,
  formatOperativeCode,
} from "@/lib/services/pricing";

const clientUserAlias = alias(users, "client_user");

export const GET = withAuth(async (req: NextRequest, { user }) => {
  try {
    const db = await getDbReady();
    const searchParams = req.nextUrl.searchParams;
    const moduleType = searchParams.get("module") as TaskModule | null;
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const conditions = [];

    if (user.role === "USER") {
      conditions.push(eq(tasks.userId, user.sub));
    } else if (user.role === "AGENT") {
      if (status === "open" || status === "PENDING") {
        // Unassigned open tasks available for agents to claim
        conditions.push(
          sql`${tasks.agentId} IS NULL AND ${tasks.status} IN ('PENDING', 'MATCHED')`
        );
      } else {
        // Default: tasks assigned to this agent
        conditions.push(eq(tasks.agentId, user.sub));
      }
    }

    const propertyId = searchParams.get("propertyId");

    if (moduleType) {
      conditions.push(eq(tasks.moduleType, moduleType));
    }

    if (propertyId) {
      conditions.push(eq(tasks.propertyId, propertyId));
    }

    if (status && status !== "open") {
      const statuses = status
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean) as TaskStatus[];
      if (statuses.length === 1) {
        conditions.push(eq(tasks.status, statuses[0]));
      } else if (statuses.length > 1) {
        conditions.push(inArray(tasks.status, statuses));
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const dbTasks = await db
      .select({
        task: tasks,
        agentName: users.name,
        clientName: clientUserAlias.name,
        clientEmail: clientUserAlias.email,
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.agentId, users.id))
      .leftJoin(clientUserAlias, eq(tasks.userId, clientUserAlias.id))
      .where(whereClause)
      .orderBy(desc(tasks.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    // Reconcile any DRAFT tasks that have a completed Paystack payment
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    for (const row of dbTasks) {
      const t = row.task;
      if (t.status === "DRAFT") {
        const taskPayments = await db
          .select()
          .from(payments)
          .where(eq(payments.taskId, t.id))
          .orderBy(desc(payments.createdAt))
          .limit(2);

        const captured = taskPayments.find((p) => p.status === "CAPTURED");
        if (captured) {
          await db
            .update(tasks)
            .set({ status: "PENDING", updatedAt: new Date() })
            .where(eq(tasks.id, t.id));
          t.status = "PENDING";
        } else if (secretKey) {
          const pendingWithRef = taskPayments.find(
            (p) => p.status === "PENDING" && p.gatewayRef
          );
          if (pendingWithRef?.gatewayRef) {
            try {
              const verifyRes = await fetch(
                `https://api.paystack.co/transaction/verify/${encodeURIComponent(
                  pendingWithRef.gatewayRef
                )}`,
                {
                  headers: { Authorization: `Bearer ${secretKey}` },
                }
              );
              const verifyJson = await verifyRes.json();
              if (
                verifyRes.ok &&
                verifyJson.status &&
                verifyJson.data?.status === "success"
              ) {
                await Promise.all([
                  db
                    .update(payments)
                    .set({ status: "CAPTURED" })
                    .where(eq(payments.id, pendingWithRef.id)),
                  db
                    .update(tasks)
                    .set({ status: "PENDING", updatedAt: new Date() })
                    .where(eq(tasks.id, t.id)),
                ]);
                t.status = "PENDING";
              }
            } catch {
              // Non-blocking fallback
            }
          }
        }
      }
    }

    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user.role);
    const isAgent = user.role === "AGENT";

    const mappedTasks: Task[] = dbTasks.map(({ task: t, agentName, clientName, clientEmail }) => {
      const dual = resolveTaskDualPricing(t);
      const operativeCode = t.agentId ? formatOperativeCode(t.agentId) : null;

      // Role-specific price & identity exposure:
      // - AGENT only ever sees `agentPayoutNgn` as `priceNgn`
      // - USER only ever sees `clientPriceNgn` and anonymized `OS-XXXXXX` code (never agent real name)
      // - ADMIN sees both `clientPriceNgn`, `agentPayoutNgn`, `platformMarginNgn`, real agent name, and `OS-XXXXXX`
      const visiblePriceNgn = isAgent ? dual.agentPayoutNgn : dual.clientPriceNgn;
      const visibleAgentName = isAdmin
        ? agentName || null
        : operativeCode
          ? `Operative ${operativeCode}`
          : null;

      return {
        ...t,
        moduleType: t.moduleType as TaskModule,
        status: t.status as TaskStatus,
        priority: t.priority ?? "normal",
        formData: (t.formData as Record<string, unknown>) ?? null,
        pricingBreakdown: (t.pricingBreakdown as Record<string, any>) ?? null,
        locationLat: t.locationLat ? parseFloat(t.locationLat) : undefined,
        locationLng: t.locationLng ? parseFloat(t.locationLng) : undefined,
        priceNgn: visiblePriceNgn,
        clientPriceNgn: isAdmin ? dual.clientPriceNgn : undefined,
        agentPayoutNgn: isAdmin || isAgent ? dual.agentPayoutNgn : undefined,
        platformMarginNgn: isAdmin ? dual.platformMarginNgn : undefined,
        isAgentPayExplicitlySet: isAdmin ? dual.isAgentPayExplicitlySet : undefined,
        clientPromisedDeliveryDate: t.clientPromisedDeliveryDate
          ? t.clientPromisedDeliveryDate.toISOString()
          : null,
        scheduledAt: t.scheduledAt ? t.scheduledAt.toISOString() : null,
        completedAt: t.completedAt ? t.completedAt.toISOString() : null,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt ? t.updatedAt.toISOString() : undefined,
        agentName: visibleAgentName,
        agentCode: operativeCode,
        clientName: isAdmin
          ? clientName || clientEmail?.split("@")[0] || "Client"
          : undefined,
        assignee: t.agentId
          ? {
              id: t.agentId,
              name: visibleAgentName || operativeCode || "Operative",
              badge: operativeCode || undefined,
            }
          : null,
        property: t.locationAddress
          ? {
              id: t.propertyId || undefined,
              address: t.locationAddress,
            }
          : null,
      };
    });

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
  } catch (error) {
    console.error("GET /tasks error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: (error as Error).message },
      },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const db = await getDbReady();
    const body = await req.json();
    const {
      moduleType,
      title,
      description,
      locationAddress,
      locationLat,
      locationLng,
      propertyId,
      waypoints = [],
      purchaseItems = [],
      requiresOfficialDocs = false,
      isExpress = false,
      perimeterScale = "standard",
      requestedHours,
      formData,
    } = body;
    if (!moduleType || !title) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Module type and title are required" },
        },
        { status: 400 }
      );
    }

    let finalAddress = locationAddress;
    let finalLat = locationLat;
    let finalLng = locationLng;

    // Automatically inherit location from property if not provided
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

    // Verify user exists and is active in database
    const [existingUser] = await db
      .select({ id: users.id, isActive: users.isActive })
      .from(users)
      .where(eq(users.id, user.sub))
      .limit(1);

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message:
              "User account associated with this session no longer exists in database. Please re-authenticate.",
          },
        },
        { status: 401 }
      );
    }

    if (!existingUser.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "This account has been deactivated. Please contact support.",
          },
        },
        { status: 403 }
      );
    }

    // Automatically compute pricing and SLA parameters
    const quote = calculateTaskPricing({
      moduleType,
      waypoints,
      purchaseItems,
      requiresOfficialDocs,
      isExpress,
      perimeterScale,
      requestedHours,
    });

    const now = new Date();
    const promisedDeliveryDate = new Date(
      now.getTime() + quote.clientPromisedHours * 60 * 60 * 1000
    );

    const [newTask] = await db
      .insert(tasks)
      .values({
        userId: user.sub,
        moduleType,
        status: "PENDING",
        priority: isExpress ? "urgent" : "normal",
        title,
        description,
        locationAddress: finalAddress,
        locationLat: finalLat ? String(finalLat) : null,
        locationLng: finalLng ? String(finalLng) : null,
        propertyId,
        pricingMode: quote.pricingMode,
        quoteStatus: quote.requiresAdminQuote ? "PENDING_ADMIN_PRICE" : "ESTIMATED",
        agentTargetHours: quote.agentTargetHours,
        clientPromisedHours: quote.clientPromisedHours,
        clientPromisedDeliveryDate: promisedDeliveryDate,
        waypoints: waypoints.length > 0 ? waypoints : null,
        purchaseItems: purchaseItems.length > 0 ? purchaseItems : null,
        requiresOfficialDocs,
        pricingBreakdown: quote,
        formData,
        priceNgn: String(quote.totalNgn),
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

    if (
      errCode === "23503" ||
      fullErrorStr.includes("foreign key constraint") ||
      fullErrorStr.includes("tasks_user_id_users_id_fk")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message:
              "User account associated with this session no longer exists in database. Please re-authenticate.",
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
