import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { properties, users, tasks } from "@/db/schema";
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

export const GET = withAuth(
  async (_req: NextRequest) => {
    try {
      const db = await getDbReady();

      const [propRows, allUsers, allTasks] = await Promise.all([
        db.select().from(properties).orderBy(desc(properties.createdAt)),
        db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            avatarUrl: users.avatarUrl,
            role: users.role,
          })
          .from(users),
        db
          .select({
            id: tasks.id,
            propertyId: tasks.propertyId,
            moduleType: tasks.moduleType,
            status: tasks.status,
            agentId: tasks.agentId,
          })
          .from(tasks),
      ]);

      const userMap = new Map(allUsers.map((u) => [u.id, u]));

      const tasksByProp = new Map<string, typeof allTasks>();
      for (const t of allTasks) {
        if (!t.propertyId) continue;
        const list = tasksByProp.get(t.propertyId) || [];
        list.push(t);
        tasksByProp.set(t.propertyId, list);
      }

      const items = propRows.map((p) => {
        const meta = parsePropertyDescriptionMeta(p.description, p.parcelNumber);
        const ext = extractExtendedMeta(p.description);
        const owner = userMap.get(p.userId);
        const assignedAgentId = ext.assignedAgentId || null;
        const assignedAgent = assignedAgentId ? userMap.get(assignedAgentId) || null : null;
        const propTasks = tasksByProp.get(p.id) || [];

        const isOwned = meta.ownershipType === "OWNED";
        const ownershipVerificationStatus =
          ext.ownershipVerificationStatus || (isOwned ? "PENDING" : "NOT_APPLICABLE");

        const hasCompletedVulnTest = propTasks.some(
          (t) => t.moduleType === "VULNERABILITY_TEST" && t.status === "COMPLETED"
        );
        const hasActiveVulnTest = propTasks.some(
          (t) =>
            t.moduleType === "VULNERABILITY_TEST" &&
            t.status !== "COMPLETED" &&
            t.status !== "CANCELLED"
        );

        const vulnerabilityTestStatus = !isOwned
          ? "NOT_APPLICABLE"
          : hasCompletedVulnTest
          ? "COMPLETED"
          : hasActiveVulnTest
          ? "IN_PROGRESS"
          : "PENDING";

        return {
          id: p.id,
          title: p.title,
          address: p.address,
          propertyType: p.propertyType || "Property",
          ownershipType: meta.ownershipType,
          parcelNumber: p.parcelNumber,
          description: meta.description,
          baselinePhotos: meta.baselinePhotos,
          proofOfOwnershipUrl: meta.proofOfOwnershipUrl,
          estimatedValueNgn: Number(ext.estimatedValueNgn || 0),
          ownershipVerificationStatus,
          vulnerabilityTestStatus,
          scheduleConfig: ext.scheduleConfig || {
            cadence: "SEMI_ANNUALLY",
            autoDispenseEnabled: true,
            subscriptionTier: "STANDARD",
          },
          assignedAgent: assignedAgent
            ? {
                id: assignedAgent.id,
                name: assignedAgent.name,
                email: assignedAgent.email,
                phone: assignedAgent.phone,
                avatarUrl: assignedAgent.avatarUrl,
              }
            : null,
          owner: owner
            ? {
                id: owner.id,
                name: owner.name,
                email: owner.email,
                phone: owner.phone,
                avatarUrl: owner.avatarUrl,
              }
            : null,
          taskCount: propTasks.length,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        };
      });

      return NextResponse.json<ApiResponse<typeof items>>({
        success: true,
        data: items,
      });
    } catch (error) {
      console.error("Admin Get Properties Error:", error);
      return NextResponse.json(
        { success: false, error: { code: "INTERNAL_ERROR", message: (error as Error).message } },
        { status: 500 }
      );
    }
  },
  { roles: ["ADMIN", "SUPER_ADMIN"] }
);

