import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { users, agentProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface FullUserProfileResponse {
  id: string;
  email: string;
  name: string;
  fullName: string;
  phone: string | null;
  title?: string | null;
  address?: string | null;
  location?: string | null;
  occupation?: string | null;
  state?: string | null;
  country?: string | null;
  residence?: string | null;
  avatarUrl: string | null;
  role: string;
  kycStatus: string;
  ninVerificationStatus: string;
  nbaVerificationStatus: string;
  isActive: boolean;
  isDiasporaUser: boolean;
  preferredCurrency: string;
  joinedDate: string;
  createdAt: string;
  updatedAt: string;
  agentProfile?: {
    tier: string;
    nbaNumber?: string | null;
    ninId?: string | null;
    rating: string;
    totalTasks: number;
    isAvailable: boolean;
  } | null;
}

export const GET = withAuth(async (req: NextRequest, { user }) => {
  try {
    const db = await getDbReady();
    const foundUsers = await db
      .select()
      .from(users)
      .where(eq(users.id, user.sub))
      .limit(1);

    if (foundUsers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "User account from authorization token does not exist in the database. Please log in again.",
          },
        },
        { status: 401 }
      );
    }

    const dbUser = foundUsers[0];

    // Fetch agent profile if user has AGENT role
    let agentProfileData = null;
    if (dbUser.role === "AGENT") {
      const foundAgents = await db
        .select()
        .from(agentProfiles)
        .where(eq(agentProfiles.userId, dbUser.id))
        .limit(1);

      if (foundAgents.length > 0) {
        const ap = foundAgents[0];
        agentProfileData = {
          tier: ap.tier,
          nbaNumber: ap.nbaNumber,
          ninId: ap.ninId,
          rating: ap.rating || "0.00",
          totalTasks: ap.totalTasks,
          isAvailable: ap.isAvailable,
        };
      }
    }

    const profileData: FullUserProfileResponse = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name || "User",
      fullName: dbUser.name || "User",
      phone: dbUser.phone,
      title: dbUser.title,
      address: dbUser.address,
      location: dbUser.location,
      occupation: dbUser.occupation,
      state: dbUser.state,
      country: dbUser.country,
      residence: dbUser.residence,
      avatarUrl: dbUser.avatarUrl || null,
      role: dbUser.role,
      kycStatus: dbUser.kycStatus,
      ninVerificationStatus: dbUser.ninVerificationStatus || dbUser.kycStatus.toLowerCase(),
      nbaVerificationStatus: dbUser.nbaVerificationStatus || "pending",
      isActive: dbUser.isActive,
      isDiasporaUser: false,
      preferredCurrency: "NGN",
      joinedDate: dbUser.createdAt.toISOString(),
      createdAt: dbUser.createdAt.toISOString(),
      updatedAt: dbUser.updatedAt.toISOString(),
      agentProfile: agentProfileData,
    };

    return NextResponse.json<ApiResponse<FullUserProfileResponse>>({
      success: true,
      data: profileData,
      message: "Profile retrieved successfully",
    });
  } catch (error) {
    console.error("GET /users/me Error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: (error as Error).message } },
      { status: 500 }
    );
  }
});

export const PATCH = withAuth(async (req: NextRequest, { user }) => {
  try {
    const db = await getDbReady();
    const body = await req.json();

    const updates: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };

    const name = body.name || body.fullName;
    if (name !== undefined) updates.name = String(name).trim() || null;

    const phone = body.phone || body.phoneNumber;
    if (phone !== undefined) updates.phone = String(phone).trim() || null;

    if (body.title !== undefined) updates.title = body.title ? String(body.title).trim() : null;
    if (body.address !== undefined) updates.address = body.address ? String(body.address).trim() : null;
    if (body.location !== undefined) updates.location = body.location ? String(body.location).trim() : null;
    if (body.occupation !== undefined) updates.occupation = body.occupation ? String(body.occupation).trim() : null;
    if (body.state !== undefined) updates.state = body.state ? String(body.state).trim() : null;
    if (body.country !== undefined) updates.country = body.country ? String(body.country).trim() : null;
    if (body.residence !== undefined) updates.residence = body.residence ? String(body.residence).trim() : null;
    if (body.avatarUrl !== undefined) updates.avatarUrl = body.avatarUrl ? String(body.avatarUrl).trim() : null;

    // Check if user is agent and wants to update availability
    if (body.isAvailable !== undefined && user.role === "AGENT") {
      await db
        .update(agentProfiles)
        .set({
          isAvailable: Boolean(body.isAvailable),
          updatedAt: new Date(),
        })
        .where(eq(agentProfiles.userId, user.sub));
    }

    if (Object.keys(updates).length <= 1 && body.isAvailable === undefined) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "No valid profile fields provided to update" } },
        { status: 400 }
      );
    }

    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, user.sub))
      .returning();

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<{
      id: string;
      email: string;
      name: string;
      fullName: string;
      phone: string | null;
      title: string | null;
      address: string | null;
      location: string | null;
      occupation: string | null;
      state: string | null;
      country: string | null;
      residence: string | null;
      avatarUrl: string | null;
      updatedAt: string;
    }>>({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name || "User",
        fullName: updatedUser.name || "User",
        phone: updatedUser.phone,
        title: updatedUser.title,
        address: updatedUser.address,
        location: updatedUser.location,
        occupation: updatedUser.occupation,
        state: updatedUser.state,
        country: updatedUser.country,
        residence: updatedUser.residence,
        avatarUrl: updatedUser.avatarUrl || null,
        updatedAt: updatedUser.updatedAt.toISOString(),
      },
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("PATCH /users/me Error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: (error as Error).message } },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (req: NextRequest, { user }) => {
  try {
    const db = await getDbReady();

    await db
      .update(users)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.sub));

    return NextResponse.json<ApiResponse<{ message: string }>>({
      success: true,
      data: { message: "Account deactivated successfully" },
      message: "Account deactivated successfully",
    });
  } catch (error) {
    console.error("DELETE /users/me Error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: (error as Error).message } },
      { status: 500 }
    );
  }
});
