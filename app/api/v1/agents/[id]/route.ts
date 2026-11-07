import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { AgentProfile, AgentTier } from "@/lib/types/user";
import { getDb } from "@/lib/db/client";
import { agentProfiles } from "@/db/schema";
import { eq, or } from "drizzle-orm";

const db = getDb();

export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, { params }) => {
    const [agent] = await db
      .select()
      .from(agentProfiles)
      .where(or(eq(agentProfiles.id, params.id), eq(agentProfiles.userId, params.id)))
      .limit(1);

    if (!agent) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Agent profile not found" },
        },
        { status: 404 }
      );
    }

    const formattedProfile: AgentProfile = {
      id: agent.id,
      userId: agent.userId,
      tier: agent.tier as AgentTier,
      nbaNumber: agent.nbaNumber,
      ninId: agent.ninId,
      rating: parseFloat(agent.rating || "0"),
      totalTasks: agent.totalTasks,
      isAvailable: agent.isAvailable,
      serviceAreaLat: agent.serviceAreaLat ? parseFloat(agent.serviceAreaLat) : null,
      serviceAreaLng: agent.serviceAreaLng ? parseFloat(agent.serviceAreaLng) : null,
      serviceRadiusKm: parseFloat(agent.serviceRadiusKm || "10"),
      createdAt: agent.createdAt.toISOString(),
      updatedAt: agent.updatedAt.toISOString(),
    };

    return NextResponse.json<ApiResponse<AgentProfile>>({
      success: true,
      data: formattedProfile,
    });
  }
);

export const PATCH = withAuth<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    const [existing] = await db
      .select()
      .from(agentProfiles)
      .where(or(eq(agentProfiles.id, params.id), eq(agentProfiles.userId, params.id)))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Agent profile not found" },
        },
        { status: 404 }
      );
    }

    // Only admin or the agent themselves can modify their profile
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.sub !== existing.userId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Not authorized to modify this agent" },
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (typeof body.isAvailable === "boolean") updateData.isAvailable = body.isAvailable;
    if (body.serviceRadiusKm !== undefined) updateData.serviceRadiusKm = String(body.serviceRadiusKm);
    if (body.serviceAreaLat !== undefined) updateData.serviceAreaLat = String(body.serviceAreaLat);
    if (body.serviceAreaLng !== undefined) updateData.serviceAreaLng = String(body.serviceAreaLng);
    if (body.bankCode) updateData.bankCode = body.bankCode;
    if (body.bankAccountNumber) updateData.bankAccountNumber = body.bankAccountNumber;
    if (body.bankAccountName) updateData.bankAccountName = body.bankAccountName;
    if (body.tier && (user.role === "ADMIN" || user.role === "SUPER_ADMIN")) updateData.tier = body.tier;

    await db
      .update(agentProfiles)
      .set(updateData)
      .where(eq(agentProfiles.id, existing.id));

    return NextResponse.json<ApiResponse<{ updated: boolean }>>({
      success: true,
      data: { updated: true },
    });
  }
);
