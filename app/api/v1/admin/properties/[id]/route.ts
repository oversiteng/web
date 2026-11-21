import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { properties, users, tasks, taskMilestones, taskChats, notifications } from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { parsePropertyDescriptionMeta } from "@/lib/services/propertyTaskService";

function extractExtendedMeta(rawDescription: string | null) {
  if (!rawDescription) return {};
  try {
    const parsed = JSON.parse(rawDescription);
    if (parsed && typeof parsed === "object" && parsed.__meta) {
      return parsed;
    }
  } catch {
    // Plain text description
  }
  return {};
}

export const GET = withAuth<{ id: string }>(
  async (_req: NextRequest, { params }) => {
    try {
      const { id } = await params;
      const db = await getDbReady();

      const [prop] = await db
        .select()
        .from(properties)
        .where(eq(properties.id, id))
        .limit(1);

      if (!prop) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Property not found" } },
          { status: 404 }
        );
      }

      const meta = parsePropertyDescriptionMeta(prop.description, prop.parcelNumber);
      const ext = extractExtendedMeta(prop.description);

      const [ownerRows, agentRows, propTasks, availableAgents] = await Promise.all([
        db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            avatarUrl: users.avatarUrl,
          })
          .from(users)
          .where(eq(users.id, prop.userId))
          .limit(1),
        ext.assignedAgentId
          ? db
              .select({
                id: users.id,
                name: users.name,
                email: users.email,
                phone: users.phone,
                avatarUrl: users.avatarUrl,
              })
              .from(users)
              .where(eq(users.id, ext.assignedAgentId))
              .limit(1)
          : Promise.resolve([]),
        db
          .select()
          .from(tasks)
          .where(eq(tasks.propertyId, prop.id))
          .orderBy(desc(tasks.createdAt)),
        db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            role: users.role,
            isActive: users.isActive,
            kycStatus: users.kycStatus,
          })
          .from(users)
          .where(inArray(users.role, ["ADMIN", "SUPER_ADMIN", "AGENT"])),
      ]);

      const isOwned = meta.ownershipType === "OWNED";
      const hasCompletedVulnTest = propTasks.some(
        (t) => t.moduleType === "VULNERABILITY_TEST" && t.status === "COMPLETED"
      );
      const hasActiveVulnTest = propTasks.some(
        (t) =>
          t.moduleType === "VULNERABILITY_TEST" &&
          t.status !== "COMPLETED" &&
          t.status !== "CANCELLED"
      );

      const data = {
        id: prop.id,
        title: prop.title,
        address: prop.address,
        latitude: prop.latitude ? parseFloat(prop.latitude) : null,
        longitude: prop.longitude ? parseFloat(prop.longitude) : null,
        parcelNumber: prop.parcelNumber,
        propertyType: prop.propertyType || "Property",
        ownershipType: meta.ownershipType,
        description: meta.description,
        baselinePhotos: meta.baselinePhotos,
        proofOfOwnershipUrl: meta.proofOfOwnershipUrl,
        intelTimeline: meta.intelTimeline,
        estimatedValueNgn: Number(ext.estimatedValueNgn || 0),
        acquisitionCostNgn: Number(ext.acquisitionCostNgn || 0),
        documentationCostNgn: Number(ext.documentationCostNgn || 0),
        ownershipVerificationStatus:
          ext.ownershipVerificationStatus || (isOwned ? "PENDING" : "PENDING_REVIEW"),
        reviewStatus:
          ext.reviewStatus ||
          (ext.ownershipVerificationStatus === "VERIFIED" || propTasks.length > 0
            ? "APPROVED"
            : "PENDING_ADMIN_REVIEW"),
        ownershipVerificationNote: ext.ownershipVerificationNote || null,
        vulnerabilityTestStatus: !isOwned
          ? "NOT_APPLICABLE"
          : hasCompletedVulnTest
          ? "COMPLETED"
          : hasActiveVulnTest
          ? "IN_PROGRESS"
          : "PENDING",
        scheduleConfig: ext.scheduleConfig || {
          cadence: "SEMI_ANNUALLY",
          autoDispenseEnabled: true,
          subscriptionTier: "STANDARD",
        },
        owner: ownerRows[0] || null,
        assignedAgent: agentRows[0] || null,
        tasks: propTasks.map((t) => ({
          id: t.id,
          title: t.title,
          moduleType: t.moduleType,
          status: t.status,
          priceNgn: t.priceNgn ? parseFloat(t.priceNgn) : 0,
          formData: t.formData,
          createdAt: t.createdAt.toISOString(),
          completedAt: t.completedAt ? t.completedAt.toISOString() : null,
        })),
        availableAgents: availableAgents
          .filter((a) => a.isActive)
          .sort((a, b) => {
            const aIsAdmin = a.role === "ADMIN" || a.role === "SUPER_ADMIN" ? 0 : 1;
            const bIsAdmin = b.role === "ADMIN" || b.role === "SUPER_ADMIN" ? 0 : 1;
            return aIsAdmin - bIsAdmin;
          }),
        createdAt: prop.createdAt.toISOString(),
        updatedAt: prop.updatedAt.toISOString(),
      };

      return NextResponse.json<ApiResponse<typeof data>>({
        success: true,
        data,
      });
    } catch (error) {
      console.error("Admin Get Property Detail Error:", error);
      return NextResponse.json(
        { success: false, error: { code: "INTERNAL_ERROR", message: (error as Error).message } },
        { status: 500 }
      );
    }
  },
  { roles: ["ADMIN", "SUPER_ADMIN"] }
);

export const PATCH = withAuth<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const { id } = await params;
      const body = await req.json();
      const {
        assignedAgentId,
        estimatedValueNgn,
        acquisitionCostNgn,
        documentationCostNgn,
        ownershipVerificationStatus,
        ownershipVerificationNote,
        reviewStatus,
        scheduleConfig,
      } = body;

      const db = await getDbReady();
      const [prop] = await db
        .select()
        .from(properties)
        .where(eq(properties.id, id))
        .limit(1);

      if (!prop) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Property not found" } },
          { status: 404 }
        );
      }

      const meta = parsePropertyDescriptionMeta(prop.description, prop.parcelNumber);
      const ext = extractExtendedMeta(prop.description);
      const now = new Date();

      const updatedMeta: Record<string, any> = {
        ...ext,
        __meta: true,
        ownershipType: meta.ownershipType,
        landmarkDescription: meta.description || "",
        baselinePhotos: meta.baselinePhotos,
        proofOfOwnershipUrl: meta.proofOfOwnershipUrl || null,
        intelTimeline: meta.intelTimeline,
      };

      if (assignedAgentId !== undefined) {
        updatedMeta.assignedAgentId = assignedAgentId || null;
      }
      if (estimatedValueNgn !== undefined) {
        updatedMeta.estimatedValueNgn = Number(estimatedValueNgn) || 0;
      }
      if (acquisitionCostNgn !== undefined) {
        updatedMeta.acquisitionCostNgn = Number(acquisitionCostNgn) || 0;
      }
      if (documentationCostNgn !== undefined) {
        updatedMeta.documentationCostNgn = Number(documentationCostNgn) || 0;
      }
      if (scheduleConfig && typeof scheduleConfig === "object") {
        updatedMeta.scheduleConfig = {
          ...(ext.scheduleConfig || {}),
          ...scheduleConfig,
        };
      }

      const isApprovingNow =
        reviewStatus === "APPROVED" || ownershipVerificationStatus === "VERIFIED";

      if (reviewStatus) {
        updatedMeta.reviewStatus = reviewStatus;
      }
      if (ownershipVerificationStatus) {
        updatedMeta.ownershipVerificationStatus = ownershipVerificationStatus;
        updatedMeta.ownershipVerificationNote = ownershipVerificationNote || null;
        if (ownershipVerificationStatus === "VERIFIED") {
          updatedMeta.reviewStatus = "APPROVED";
        }
      } else if (isApprovingNow) {
        updatedMeta.ownershipVerificationStatus = "VERIFIED";
        updatedMeta.reviewStatus = "APPROVED";
      }

      // If approved and no baseline PROPERTY_OVERSITE task exists yet, dispense the initial subscription-included task
      if (isApprovingNow) {
        const existingPropTasks = await db
          .select({ id: tasks.id })
          .from(tasks)
          .where(eq(tasks.propertyId, prop.id));

        const cadenceLabel =
          (updatedMeta.scheduleConfig?.cadence || "SEMI_ANNUALLY")
            .replace(/_/g, " ")
            .toLowerCase();

        if (existingPropTasks.length === 0) {
          const promisedDeliveryDate = new Date(now.getTime() + 168 * 60 * 60 * 1000);
          const managerId = updatedMeta.assignedAgentId || user.sub;

          const [dispensedTask] = await db
            .insert(tasks)
            .values({
              userId: prop.userId,
              propertyId: prop.id,
              moduleType: "PROPERTY_OVERSITE",
              status: "PENDING",
              priority: "normal",
              title: `Property Oversight: ${prop.title}`,
              description:
                meta.description ||
                `Baseline subscription property intelligence: Physical site summary, community inquiry ("Word on the Street"), statutory layout compliance, and vicinity landmarks for ${prop.title} (${prop.address}).`,
              locationAddress: prop.address,
              locationLat: prop.latitude,
              locationLng: prop.longitude,
              priceNgn: "0",
              pricingMode: "SUBSCRIPTION_INCLUDED",
              quoteStatus: "INCLUDED_IN_SUBSCRIPTION",
              agentTargetHours: 72,
              clientPromisedHours: 168,
              clientPromisedDeliveryDate: promisedDeliveryDate,
              pricingBreakdown: {
                clientPriceNgn: 0,
                agentPayoutNgn: 10500,
                platformMarginNgn: 0,
                isSubscriptionIncluded: true,
                isAgentPayExplicitlySet: true,
              },
              formData: {
                isPropertyIntelTask: true,
                isSubscriptionIncluded: true,
                propertyId: prop.id,
                propertyTitle: prop.title,
                ownershipType: meta.ownershipType,
                landmarkDescription: meta.description || "",
                scheduleCadence: updatedMeta.scheduleConfig?.cadence || "SEMI_ANNUALLY",
              },
            })
            .returning();

          if (dispensedTask) {
            await db.insert(taskMilestones).values([
              {
                taskId: dispensedTask.id,
                title: "1. Physical Site Summary & Geofence Verification",
                description:
                  "Verify perimeter fence, occupancy status, setback compliance, and capture geo-tagged baseline photographs.",
                orderIndex: 1,
                status: "PENDING",
                completionPct: 0,
              },
              {
                taskId: dispensedTask.id,
                title: "2. Word on the Street (Community & Neighbor Inquiries)",
                description:
                  "Interview caretakers and adjacent property managers to verify absence of communal disputes or encroachment.",
                orderIndex: 2,
                status: "PENDING",
                completionPct: 0,
              },
              {
                taskId: dispensedTask.id,
                title: "3. Statutory Layout Directives & Vicinity Landmarks",
                description:
                  "Verify state physical planning compliance, surveyor general beacon coordinates, and vicinity transit landmarks.",
                orderIndex: 3,
                status: "PENDING",
                completionPct: 0,
              },
            ]);

            await db.insert(taskChats).values({
              taskId: dispensedTask.id,
              senderId: managerId,
              receiverId: prop.userId,
              rawMessage: `Your property "${prop.title}" has been verified and activated on a ${cadenceLabel} monitoring schedule. You are connected directly with your Oversite Personal Property Manager here.`,
              moderatedMessage: `Your property "${prop.title}" has been verified and activated on a ${cadenceLabel} monitoring schedule. You are connected directly with your Oversite Personal Property Manager here.`,
              message: `Your property "${prop.title}" has been verified and activated on a ${cadenceLabel} monitoring schedule. You are connected directly with your Oversite Personal Property Manager here.`,
              messageType: "TEXT",
              isModerated: true,
              moderationStatus: "APPROVED_AS_IS",
            });
          }
        }

        await db.insert(notifications).values({
          userId: prop.userId,
          type: "SYSTEM",
          title: `Property Verified & Monitoring Active: ${prop.title}`,
          body:
            ownershipVerificationNote ||
            `Your property "${prop.title}" has been verified by Central Operations. Baseline inspection has been initiated and recurring updates are scheduled (${cadenceLabel}).`,
        });
      } else if (ownershipVerificationStatus === "REJECTED" || reviewStatus === "REJECTED") {
        await db.insert(notifications).values({
          userId: prop.userId,
          type: "ALERT",
          title: `Property Verification Action Required: ${prop.title}`,
          body:
            ownershipVerificationNote ||
            `Your listing "${prop.title}" requires additional verification details before monitoring can begin.`,
        });
      }

      await db
        .update(properties)
        .set({
          description: JSON.stringify(updatedMeta),
          updatedAt: now,
        })
        .where(eq(properties.id, id));

      return NextResponse.json<ApiResponse<{ updated: boolean }>>({
        success: true,
        data: { updated: true },
        message: "Property updated successfully",
      });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: { code: "INTERNAL_ERROR", message: (error as Error).message } },
        { status: 500 }
      );
    }
  },
  { roles: ["ADMIN", "SUPER_ADMIN"] }
);

