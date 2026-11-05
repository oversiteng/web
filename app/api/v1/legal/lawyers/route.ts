import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDb } from "@/lib/db/client";
import { agentProfiles, users } from "@/db/schema";
import { eq } from "drizzle-orm";

const db = getDb();

export interface VerifiedLawyer {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  nbaNumber: string | null;
  rating: number;
  totalTasks: number;
  isAvailable: boolean;
  specialization: string;
  hourlyRateNgn: number;
}

export const GET = withAuth(async (req: NextRequest) => {
  const lawyers = await db
    .select({
      id: agentProfiles.id,
      userId: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      nbaNumber: agentProfiles.nbaNumber,
      rating: agentProfiles.rating,
      totalTasks: agentProfiles.totalTasks,
      isAvailable: agentProfiles.isAvailable,
    })
    .from(agentProfiles)
    .innerJoin(users, eq(agentProfiles.userId, users.id))
    .where(eq(agentProfiles.tier, "LEGAL_COUNSEL"));

  const formatted: VerifiedLawyer[] = lawyers.map((l) => ({
    id: l.id,
    userId: l.userId,
    name: l.name || "Barrister & Solicitor of Nigeria",
    email: l.email,
    avatarUrl: l.avatarUrl,
    nbaNumber: l.nbaNumber,
    rating: parseFloat(l.rating || "5.00"),
    totalTasks: l.totalTasks,
    isAvailable: l.isAvailable,
    specialization: "Property Law, Land Title Verification & Dispute Litigation",
    hourlyRateNgn: 40000,
  }));

  return NextResponse.json<ApiResponse<VerifiedLawyer[]>>({
    success: true,
    data: formatted,
  });
});
