import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { properties, users, tasks, notifications } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
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
            isActive: users.isActive,
            kycStatus: users.kycStatus,
          })
          .from(users)
          .where(eq(users.role, "AGENT")),
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
          ext.ownershipVerificationStatus || (isOwned ? "PENDING" : "NOT_APPLICABLE"),
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
        availableAgents: availableAgents.filter((a) => a.isActive),
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
  async (req: NextRequest, { params }) => {
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
      if (ownershipVerificationStatus) {
        updatedMeta.ownershipVerificationStatus = ownershipVerificationStatus;
        updatedMeta.ownershipVerificationNote = ownershipVerificationNote || null;

        await db.insert(notifications).values({
          userId: prop.userId,
          type: ownershipVerificationStatus === "REJECTED" ? "ALERT" : "SYSTEM",
          title:
            ownershipVerificationStatus === "VERIFIED"
              ? `Property Ownership Verified: ${prop.title}`
              : `Property Ownership Verification Update: ${prop.title}`,
          body:
            ownershipVerificationNote ||
            (ownershipVerificationStatus === "VERIFIED"
              ? `Your ownership documentation for ${prop.title} has been verified by Central Operations.`
              : `Your ownership documentation for ${prop.title} requires review. Please re-submit valid proof of ownership.`),
        });
      }
      if (scheduleConfig && typeof scheduleConfig === "object") {
        updatedMeta.scheduleConfig = {
          ...(ext.scheduleConfig || {}),
          ...scheduleConfig,
        };
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

