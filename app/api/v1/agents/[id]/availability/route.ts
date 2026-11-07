import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { agentProfiles } from "@/db/schema";
import { eq, or } from "drizzle-orm";

export const PATCH = withAuth<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const { id: agentParamId } = await params;
      const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user.role);

      if (!isAdmin && user.sub !== agentParamId) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "FORBIDDEN", message: "Not authorized to change availability" },
          },
          { status: 403 }
        );
      }

      const body = await req.json();
      const { isAvailable } = body;

      if (isAvailable === undefined) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message: "isAvailable (boolean) is required" },
          },
          { status: 400 }
        );
      }

      const db = await getDbReady();

      const [updated] = await db
        .update(agentProfiles)
        .set({
          isAvailable: Boolean(isAvailable),
          updatedAt: new Date(),
        })
        .where(or(eq(agentProfiles.userId, agentParamId), eq(agentProfiles.id, agentParamId)))
        .returning();

      if (!updated) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Agent profile not found" } },
          { status: 404 }
        );
      }

      return NextResponse.json<ApiResponse<{ agentId: string; isAvailable: boolean }>>({
        success: true,
        data: {
          agentId: updated.userId,
          isAvailable: updated.isAvailable,
        },
        message: `Operative status set to ${updated.isAvailable ? "AVAILABLE" : "UNAVAILABLE"}.`,
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INTERNAL_ERROR", message: (error as Error).message },
        },
        { status: 500 }
      );
    }
  },
  { roles: ["AGENT", "ADMIN", "SUPER_ADMIN"] }
);
