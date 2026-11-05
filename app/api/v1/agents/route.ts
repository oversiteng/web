import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { PaginatedResponse } from "@/lib/types/api";
import { AgentProfile, AgentTier } from "@/lib/types/user";
import { getDb } from "@/lib/db/client";
import { agentProfiles, users } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

const db = getDb();

export const GET = withAuth(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const tier = searchParams.get("tier") as AgentTier | null;
  const availableOnly = searchParams.get("available") === "true";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const offset = (page - 1) * limit;

  const conditions = [];
  if (tier) {
    conditions.push(eq(agentProfiles.tier, tier));
  }
  if (availableOnly) {
    conditions.push(eq(agentProfiles.isAvailable, true));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [dbAgents, totalCountResult] = await Promise.all([
    db
      .select({
        id: agentProfiles.id,
        userId: agentProfiles.userId,
        tier: agentProfiles.tier,
        nbaNumber: agentProfiles.nbaNumber,
        ninId: agentProfiles.ninId,
        rating: agentProfiles.rating,
        totalTasks: agentProfiles.totalTasks,
        isAvailable: agentProfiles.isAvailable,
        serviceAreaLat: agentProfiles.serviceAreaLat,
        serviceAreaLng: agentProfiles.serviceAreaLng,
        serviceRadiusKm: agentProfiles.serviceRadiusKm,
        createdAt: agentProfiles.createdAt,
        updatedAt: agentProfiles.updatedAt,
      })
      .from(agentProfiles)
      .where(whereClause)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(agentProfiles)
      .where(whereClause),
  ]);

  const total = Number(totalCountResult[0]?.count || 0);
  const totalPages = Math.ceil(total / limit);

  const formattedAgents: AgentProfile[] = dbAgents.map((a) => ({
    id: a.id,
    userId: a.userId,
    tier: a.tier as AgentTier,
    nbaNumber: a.nbaNumber,
    ninId: a.ninId,
    rating: parseFloat(a.rating || "0"),
    totalTasks: a.totalTasks,
    isAvailable: a.isAvailable,
    serviceAreaLat: a.serviceAreaLat ? parseFloat(a.serviceAreaLat) : null,
    serviceAreaLng: a.serviceAreaLng ? parseFloat(a.serviceAreaLng) : null,
    serviceRadiusKm: parseFloat(a.serviceRadiusKm || "10"),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  return NextResponse.json<PaginatedResponse<AgentProfile>>({
    success: true,
    data: formattedAgents,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  });
});
