import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { Task, TaskModule, TaskStatus } from "@/lib/types/task";
import { getDbReady } from "@/lib/db/client";
import { tasks, users, taskMilestones, taskReports, properties, payments, taskChats, notifications, legalConsultations, dueDiligenceDossiers } from "@/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { extractMilestoneMeta } from "@/app/api/v1/tasks/[id]/milestones/route";
import { resolveTaskDualPricing, formatOperativeCode } from "@/lib/services/pricing";
import { extractAdminPolicy } from "@/lib/auth/adminPermissions";
import { resolveTaskExecutionBlueprint } from "@/lib/services/taskBlueprints";

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
          title: "1. Physical Site Summary & Geofence Verification",
          description:
            "Verify perimeter fence, occupancy status, setback compliance, and capture geo-tagged baseline photographs.",
          orderIndex: 1,
          deliverableType: "INSPECTION_CHECKLIST",
          status: "PENDING" as const,
          completionPct: 0,
        },
        {
          taskId,
          title: "2. Word on the Street (Community & Neighbor Inquiries)",
          description:
            "Interview caretakers and adjacent property managers to verify absence of communal disputes or encroachment.",
          orderIndex: 2,
          deliverableType: "INSPECTION_CHECKLIST",
          status: "PENDING" as const,
          completionPct: 0,
        },
        {
          taskId,
          title: "3. Statutory Layout Directives & Vicinity Landmarks",
          description:
            "Verify state physical planning compliance, surveyor general beacon coordinates, and vicinity transit landmarks.",
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

      // Enforce ownership/assignment authorization (agents may preview unassigned PENDING tasks)
      const canViewTask =
        isAdmin ||
        t.userId === user.sub ||
        t.agentId === user.sub ||
        (isAgent && !t.agentId && t.status === "PENDING");

      if (!canViewTask) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "You do not have permission to view this task.",
            },
          },
          { status: 403 }
        );
      }

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

      // 2. Resolve Task Execution Blueprint & Fetch Milestones (only seed if usesMilestones)
      const executionBlueprint = resolveTaskExecutionBlueprint({
        moduleType: t.moduleType,
        description: t.description,
        formData: (t.formData as Record<string, any>) ?? null,
      });

      let milestones = await db
        .select()
        .from(taskMilestones)
        .where(eq(taskMilestones.taskId, id))
        .orderBy(asc(taskMilestones.orderIndex));

      // Only seed default milestones for multi-phase modules (all starting at PENDING 0%)
      if (milestones.length === 0 && executionBlueprint.usesMilestones) {
        const defaultList = getDefaultMilestones(t.moduleType, t.id, t.description).map((m) => ({
          ...m,
          status: "PENDING" as const,
          completionPct: 0,
        }));
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

      // 6. Dual-Price Economics & Legacy Property Oversight Normalization
      // If an existing PROPERTY_OVERSITE / property-intel task still had legacy AUTO_STANDARD ₦15,000 / 24h in DB, normalize it to SUBSCRIPTION_INCLUDED (₦0 client charge, 72h agent target / 7-day baseline window)
      const isLegacyPropertyIntel =
        (t.moduleType === "PROPERTY_OVERSITE" && Boolean(t.propertyId)) ||
        Boolean((t.formData as any)?.isPropertyIntelTask);

      if (
        isLegacyPropertyIntel &&
        t.pricingMode !== "SUBSCRIPTION_INCLUDED" &&
        t.pricingMode !== "ADMIN_MANUAL"
      ) {
        t.pricingMode = "SUBSCRIPTION_INCLUDED";
        t.quoteStatus = "INCLUDED_IN_SUBSCRIPTION";
        t.priceNgn = "0";
        if (!t.agentTargetHours || t.agentTargetHours === 24) {
          t.agentTargetHours = 72;
          t.clientPromisedHours = 168;
        }
        await db
          .update(tasks)
          .set({
            pricingMode: "SUBSCRIPTION_INCLUDED",
            quoteStatus: "INCLUDED_IN_SUBSCRIPTION",
            priceNgn: "0",
            agentTargetHours: t.agentTargetHours,
            clientPromisedHours: t.clientPromisedHours,
          })
          .where(eq(tasks.id, t.id))
          .catch(() => {});
      }

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
        executionBlueprint,
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
  async (req: NextRequest, { user, params }) => {
    try {
      const { id } = await params;
      const body = await req.json();
      const db = await getDbReady();

      const { executionBlueprint, ...rest } = body;
      const updates: Record<string, any> = {
        ...rest,
        updatedAt: new Date(),
      };

      if (executionBlueprint && typeof executionBlueprint === "object") {
        if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
          return NextResponse.json(
            { success: false, error: { code: "FORBIDDEN", message: "Admin access required" } },
            { status: 403 }
          );
        }
        const [existing] = await db
          .select({ formData: tasks.formData })
          .from(tasks)
          .where(eq(tasks.id, id))
          .limit(1);

        const existingFormData =
          existing?.formData && typeof existing.formData === "object"
            ? { ...(existing.formData as Record<string, any>) }
            : {};

        existingFormData.executionBlueprint = {
          ...executionBlueprint,
          adminStructuredAt: new Date().toISOString(),
        };
        if (Array.isArray(executionBlueprint.expectedAgentInputs)) {
          existingFormData.expectedAgentInputs = executionBlueprint.expectedAgentInputs;
        }
        if (Array.isArray(executionBlueprint.deliverablesChecklist)) {
          existingFormData.deliverablesChecklist = executionBlueprint.deliverablesChecklist;
        }

        updates.formData = existingFormData;
        if (executionBlueprint.operationalBrief) {
          updates.description = executionBlueprint.operationalBrief;
        }
      }

      await db.update(tasks).set(updates).where(eq(tasks.id, id));

      return NextResponse.json<ApiResponse<{ updated: boolean }>>({
        success: true,
        data: { updated: true },
        message: "Task structure updated successfully.",
      });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: { code: "INTERNAL_ERROR", message: (error as Error).message } },
        { status: 500 }
      );
    }
  }
);

export const DELETE = withAuth<{ id: string }>(
  async (_req: NextRequest, { user, params }) => {
    try {
      const { id } = await params;
      const db = await getDbReady();

      if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
        return NextResponse.json(
          {
            success: false,
            error: { code: "FORBIDDEN", message: "Only administrators can delete tasks." },
          },
          { status: 403 }
        );
      }

      if (user.role === "ADMIN") {
        const [dbAdmin] = await db
          .select({ role: users.role, isActive: users.isActive, accreditationDocuments: users.accreditationDocuments })
          .from(users)
          .where(eq(users.id, user.sub))
          .limit(1);

        const policy = dbAdmin ? extractAdminPolicy(dbAdmin) : null;
        if (!policy?.canDelete) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "FORBIDDEN",
                message: "Your admin profile does not have Delete permission.",
              },
            },
            { status: 403 }
          );
        }
      }

      const existing = await db
        .select({
          id: tasks.id,
          userId: tasks.userId,
          title: tasks.title,
          priceNgn: tasks.priceNgn,
          pricingMode: tasks.pricingMode,
          quoteStatus: tasks.quoteStatus,
          formData: tasks.formData,
        })
        .from(tasks)
        .where(eq(tasks.id, id))
        .limit(1);

      if (existing.length === 0) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Task not found" } },
          { status: 404 }
        );
      }

      const targetTask = existing[0];
      const fd = (targetTask.formData as Record<string, any>) || {};
      const isSubIncluded =
        targetTask.pricingMode === "SUBSCRIPTION_INCLUDED" ||
        targetTask.quoteStatus === "INCLUDED_IN_SUBSCRIPTION" ||
        Boolean(fd.isSubscriptionIncluded);

      const creditsToRefund = isSubIncluded
        ? 0
        : typeof fd.creditsSpent === "number"
        ? fd.creditsSpent
        : Math.round(Number(targetTask.priceNgn || 0) / 1000);

      // Refund credits to end user if any credits were spent on this task
      if (creditsToRefund > 0 && targetTask.userId) {
        const [owner] = await db
          .select({ id: users.id, accreditationDocuments: users.accreditationDocuments })
          .from(users)
          .where(eq(users.id, targetTask.userId))
          .limit(1);

        if (owner) {
          const docs =
            owner.accreditationDocuments && typeof owner.accreditationDocuments === "object"
              ? { ...(owner.accreditationDocuments as Record<string, any>) }
              : {};
          docs.creditBalance = Number(docs.creditBalance || 0) + creditsToRefund;
          await db
            .update(users)
            .set({ accreditationDocuments: docs, updatedAt: new Date() })
            .where(eq(users.id, owner.id));
        }
      }

      // Clean up dependent records before deleting task
      await db.delete(taskMilestones).where(eq(taskMilestones.taskId, id));
      await db.delete(taskChats).where(eq(taskChats.taskId, id));
      await db.delete(taskReports).where(eq(taskReports.taskId, id));
      await db.delete(notifications).where(eq(notifications.taskId, id));
      await db.delete(payments).where(eq(payments.taskId, id));
      await db.delete(legalConsultations).where(eq(legalConsultations.taskId, id));
      await db.delete(dueDiligenceDossiers).where(eq(dueDiligenceDossiers.taskId, id));

      await db.delete(tasks).where(eq(tasks.id, id));

      // Notify the end user about task removal & any refunded credits
      if (targetTask.userId) {
        await db.insert(notifications).values({
          userId: targetTask.userId,
          type: "ALERT",
          title:
            creditsToRefund > 0
              ? `Task Cancelled & ${creditsToRefund} Credits Refunded`
              : `Task Removed by Central Operations`,
          body:
            creditsToRefund > 0
              ? `Your task "${targetTask.title}" was cancelled by Central Operations. ${creditsToRefund} Oversite credits have been refunded to your credit balance.`
              : `Your task "${targetTask.title}" was removed by Central Operations.`,
        });
      }

      return NextResponse.json<ApiResponse<{ deleted: boolean; id: string; creditsRefunded: number }>>({
        success: true,
        data: { deleted: true, id, creditsRefunded: creditsToRefund },
        message:
          creditsToRefund > 0
            ? `Task "${targetTask.title}" deleted. ${creditsToRefund} credits refunded & client notified.`
            : `Task "${targetTask.title}" deleted & client notified.`,
      });
    } catch (error) {
      console.error("DELETE /api/v1/tasks/:id error:", error);
      return NextResponse.json(
        { success: false, error: { code: "INTERNAL_ERROR", message: (error as Error).message } },
        { status: 500 }
      );
    }
  },
  { roles: ["ADMIN", "SUPER_ADMIN"] }
);
