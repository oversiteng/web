import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { Task, TaskModule, TaskStatus } from "@/lib/types/task";
import { getDbReady } from "@/lib/db/client";
import { tasks, users, taskMilestones, taskReports, properties, payments } from "@/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { extractMilestoneMeta } from "@/app/api/v1/tasks/[id]/milestones/route";
import { resolveTaskDualPricing, formatOperativeCode } from "@/lib/services/pricing";

// Module default milestones configuration generator
function getDefaultMilestones(moduleType: string, taskId: string, taskDesc?: string | null) {
  switch (moduleType) {
    case "PROJECT_WATCH":
      return [
        {
          taskId,
          title: "1. Foundation & Substructure Inspection",
          description: "Stage 1: Reinforcement bars, concrete curing and DPC level verified on site.",
          orderIndex: 1,
          deliverableType: "INSPECTION_CHECKLIST",
          status: "COMPLETED" as const,
          completionPct: 100,
        },
        {
          taskId,
          title: "2. Superstructure to roof level",
          description: "Stage 2: Column alignment, blockwork integrity, lintels and first-floor deck verified.",
          orderIndex: 2,
          deliverableType: "INSPECTION_CHECKLIST",
          status: "IN_PROGRESS" as const,
          completionPct: 60,
        },
        {
          taskId,
          title: "3. Roofing, Parapet & Drainage",
          description: "Stage 3: Timber trusses, metal roof coverings and perimeter stormwater channels audit.",
          orderIndex: 3,
          deliverableType: "INSPECTION_CHECKLIST",
          status: "PENDING" as const,
          completionPct: 0,
        },
      ];
    case "PROPERTY_OVERSITE":
      return [
        {
          taskId,
          title: "1. Perimeter & Security Boundaries",
          description: "Stage 1: Perimeter wall, access gates and boundary beacon verification.",
          orderIndex: 1,
          deliverableType: "INSPECTION_CHECKLIST",
          status: "COMPLETED" as const,
          completionPct: 100,
        },
        {
          taskId,
          title: "2. Building Envelope & Utilities",
          description: "Stage 2: Exterior wall condition, water supply, meter readings and electrical connection.",
          orderIndex: 2,
          deliverableType: "INSPECTION_CHECKLIST",
          status: "IN_PROGRESS" as const,
          completionPct: 50,
        },
        {
          taskId,
          title: "3. Occupancy & Groundskeeping Audit",
          description: "Stage 3: Verification of current occupants, vegetation control and unauthorized access checks.",
          orderIndex: 3,
          deliverableType: "INSPECTION_CHECKLIST",
          status: "PENDING" as const,
          completionPct: 0,
        },
      ];
    case "DUE_DILIGENCE":
      return [
        {
          taskId,
          title: "1. Statutory Registry Search",
          description: "Stage 1: Certified true copy search at State Lands Bureau and corporate registry.",
          orderIndex: 1,
          deliverableType: "DOCUMENT_VERIFICATION",
          status: "COMPLETED" as const,
          completionPct: 100,
        },
        {
          taskId,
          title: "2. Ground Cadastral Survey",
          description: "Stage 2: Physical beacon location, GPS boundary coordinate logging and encroachment inspection.",
          orderIndex: 2,
          deliverableType: "INSPECTION_CHECKLIST",
          status: "IN_PROGRESS" as const,
          completionPct: 65,
        },
        {
          taskId,
          title: "3. Litigation & Adverse Claims Review",
          description: "Stage 3: High Court registry litigation search and traditional community ownership audit.",
          orderIndex: 3,
          deliverableType: "DOCUMENT_VERIFICATION",
          status: "PENDING" as const,
          completionPct: 0,
        },
      ];
    case "QUICK_ERRANDS":
    default:
      return [
        {
          taskId,
          title: "1. Operative Dispatch & Target Arrival",
          description: "Stage 1: Field operative allocated and arrived at designated pickup or errand location.",
          orderIndex: 1,
          deliverableType: "INSPECTION_CHECKLIST",
          status: "COMPLETED" as const,
          completionPct: 100,
        },
        {
          taskId,
          title: "2. Verification & Collection",
          description: "Stage 2: Real-time inspection of documents or goods and merchant stamped receipt acquisition.",
          orderIndex: 2,
          deliverableType: "INSPECTION_CHECKLIST",
          status: "IN_PROGRESS" as const,
          completionPct: 75,
        },
        {
          taskId,
          title: "3. Handover & Delivery Confirmation",
          description: "Stage 3: Safe transit to destination, recipient identity verification and signature/proof capture.",
          orderIndex: 3,
          deliverableType: "INSPECTION_CHECKLIST",
          status: "PENDING" as const,
          completionPct: 0,
        },
      ];
  }
}

export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const { id } = await params;
      const db = await getDbReady();

      const dbTasks = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);

      if (dbTasks.length === 0) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Task not found" } },
          { status: 404 }
        );
      }

      const t = dbTasks[0];
      const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user.role);
      const isAgent = user.role === "AGENT";

      // 0. Reconcile payment status if task is still in DRAFT or UNDER_REVIEW
      if (t.status === "DRAFT" || t.status === "UNDER_REVIEW") {
        const taskPayments = await db
          .select()
          .from(payments)
          .where(eq(payments.taskId, t.id))
          .orderBy(desc(payments.createdAt))
          .limit(3);

        const capturedPayment = taskPayments.find((p) => p.status === "CAPTURED");
        if (capturedPayment) {
          await db
            .update(tasks)
            .set({ status: "PENDING", updatedAt: new Date() })
            .where(eq(tasks.id, t.id));
          t.status = "PENDING";
        } else {
          const secretKey = process.env.PAYSTACK_SECRET_KEY;
          const pendingWithRef = taskPayments.find(
            (p) => p.status === "PENDING" && p.gatewayRef
          );
          if (secretKey && pendingWithRef?.gatewayRef) {
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

      // 1. Fetch Assigned Agent Info
      let agentData: {
        id: string;
        name: string;
        realName?: string | null;
        title: string;
        badge: string;
        avatarUrl?: string | null;
        phone?: string | null;
        email?: string | null;
      } | null = null;

      if (t.agentId) {
        const [agentUser] = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            title: users.title,
            avatarUrl: users.avatarUrl,
            phone: users.phone,
          })
          .from(users)
          .where(eq(users.id, t.agentId))
          .limit(1);

        if (agentUser) {
          const badge = formatOperativeCode(agentUser.id);
          // End User ONLY ever sees the anonymized OS-XXXXXX operative badge (never real name or phone)
          agentData = {
            id: agentUser.id,
            name: isAdmin ? agentUser.name || badge : `Operative ${badge}`,
            realName: isAdmin ? agentUser.name : undefined,
            title: agentUser.title || "Oversite Field Operative",
            badge,
            avatarUrl: isAdmin ? agentUser.avatarUrl : null,
            phone: isAdmin ? agentUser.phone : null,
            email: isAdmin ? agentUser.email : null,
          };
        }
      }

      // If no agent assigned yet but task is active, provide anonymized Oversite representation for client
      if (
        !agentData &&
        !isAdmin &&
        [
          "MATCHED",
          "AGENT_EN_ROUTE",
          "AGENT_ON_SITE",
          "IN_PROGRESS",
          "REPORT_SUBMITTED",
          "COMPLETED",
        ].includes(t.status)
      ) {
        agentData = {
          id: "oversite-ops",
          name: "Operative OS-2041",
          title: "Oversite Field Operations",
          badge: "OS-2041",
          avatarUrl: null,
          phone: null,
        };
      }

      // 2. Fetch Milestones
      let milestones = await db
        .select()
        .from(taskMilestones)
        .where(eq(taskMilestones.taskId, id))
        .orderBy(asc(taskMilestones.orderIndex));

      // If no milestones exist, seed standard institutional milestones
      if (milestones.length === 0) {
        const defaultList = getDefaultMilestones(t.moduleType, t.id, t.description);
        try {
          const inserted = await db.insert(taskMilestones).values(defaultList).returning();
          milestones = inserted;
        } catch (seedErr) {
          console.warn("Could not seed milestones into db, using in-memory defaults:", seedErr);
          milestones = defaultList.map((m, idx) => ({
            ...m,
            id: `seed-ms-${idx}`,
            targetDate: null,
            checklist: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          })) as any;
        }
      }

      const enrichedMilestones = milestones.map((m) => {
        const meta = extractMilestoneMeta(m.checklist);
        return {
          ...m,
          mediaUrls: meta.mediaUrls,
          agentNote: meta.agentNote,
          pendingApproval: meta.pendingApproval,
          pdfGenerated: meta.pdfGenerated,
        };
      });

      // 3. Fetch Task Report
      const [dbReport] = await db
        .select()
        .from(taskReports)
        .where(eq(taskReports.taskId, id))
        .limit(1);

      // 4. Fetch Linked Property
      let propertyInfo: { id: string; title: string; address: string } | null = null;
      if (t.propertyId) {
        const [prop] = await db
          .select({
            id: properties.id,
            title: properties.title,
            address: properties.address,
          })
          .from(properties)
          .where(eq(properties.id, t.propertyId))
          .limit(1);
        if (prop) propertyInfo = prop;
      }

      // 5. Fetch Client Info
      let clientName: string | null = null;
      let clientEmail: string | null = null;
      let clientPhone: string | null = null;
      if (t.userId) {
        const [clientUser] = await db
          .select({ name: users.name, email: users.email, phone: users.phone })
          .from(users)
          .where(eq(users.id, t.userId))
          .limit(1);
        if (clientUser) {
          clientName = clientUser.name || clientUser.email?.split("@")[0] || null;
          clientEmail = isAdmin ? clientUser.email : null;
          clientPhone = isAdmin ? clientUser.phone : null;
        }
      }

      // 6. Dual-Price Economics Resolution
      // - AGENT sees `agentPayoutNgn` as `priceNgn`
      // - USER sees `clientPriceNgn` as `priceNgn`
      // - ADMIN sees both + margin
      const dual = resolveTaskDualPricing(t);
      const visiblePriceNgn = isAgent ? dual.agentPayoutNgn : dual.clientPriceNgn;

      const taskData = {
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
        agentName: agentData?.name || null,
        agentCode: agentData?.badge || null,
        agent: agentData,
        clientName: isAgent ? "Oversite Client" : clientName,
        clientEmail,
        clientPhone,
        milestones: enrichedMilestones,
        report: dbReport || null,
        propertyDetails: propertyInfo,
      };

      return NextResponse.json<ApiResponse<typeof taskData>>({
        success: true,
        data: taskData,
      });
    } catch (error) {
      console.error("GET /api/v1/tasks/:id error:", error);
      return NextResponse.json(
        { success: false, error: { code: "INTERNAL_ERROR", message: (error as Error).message } },
        { status: 500 }
      );
    }
  }
);

export const PATCH = withAuth<{ id: string }>(
  async (req: NextRequest, { params }) => {
    try {
      const { id } = await params;
      const body = await req.json();
      const db = await getDbReady();

      await db
        .update(tasks)
        .set({
          ...body,
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, id));

      return NextResponse.json<ApiResponse<{ updated: boolean }>>({
        success: true,
        data: { updated: true },
      });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: { code: "INTERNAL_ERROR", message: (error as Error).message } },
        { status: 500 }
      );
    }
  }
);
