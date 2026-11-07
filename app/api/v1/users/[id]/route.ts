import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const { id: targetId } = await params;
      const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user.role);

      // Only allow user to view their own profile unless admin
      if (!isAdmin && user.sub !== targetId) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "FORBIDDEN", message: "Not authorized to access this user profile" },
          },
          { status: 403 }
        );
      }

      const db = await getDbReady();
      const [foundUser] = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          phone: users.phone,
          title: users.title,
          address: users.address,
          location: users.location,
          occupation: users.occupation,
          state: users.state,
          country: users.country,
          residence: users.residence,
          role: users.role,
          kycStatus: users.kycStatus,
          ninVerificationStatus: users.ninVerificationStatus,
          nbaVerificationStatus: users.nbaVerificationStatus,
          isActive: users.isActive,
          avatarUrl: users.avatarUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, targetId))
        .limit(1);

      if (!foundUser) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
          { status: 404 }
        );
      }

      return NextResponse.json<ApiResponse<typeof foundUser>>({
        success: true,
        data: foundUser,
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
  }
);

export const PATCH = withAuth<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const { id: targetId } = await params;
      const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user.role);

      if (!isAdmin && user.sub !== targetId) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "FORBIDDEN", message: "Not authorized to modify this user" },
          },
          { status: 403 }
        );
      }

      const body = await req.json();
      const db = await getDbReady();

      const updates: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };
      if (body.name !== undefined) updates.name = body.name ? String(body.name).trim() : null;
      if (body.phone !== undefined) updates.phone = body.phone ? String(body.phone).trim() : null;
      if (body.title !== undefined) updates.title = body.title ? String(body.title).trim() : null;
      if (body.address !== undefined) updates.address = body.address ? String(body.address).trim() : null;
      if (body.location !== undefined) updates.location = body.location ? String(body.location).trim() : null;
      if (body.occupation !== undefined) updates.occupation = body.occupation ? String(body.occupation).trim() : null;
      if (body.state !== undefined) updates.state = body.state ? String(body.state).trim() : null;
      if (body.country !== undefined) updates.country = body.country ? String(body.country).trim() : null;
      if (body.residence !== undefined) updates.residence = body.residence ? String(body.residence).trim() : null;
      if (body.avatarUrl !== undefined) updates.avatarUrl = body.avatarUrl ? String(body.avatarUrl).trim() : null;

      // Admin-only fields
      if (isAdmin) {
        if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive);
        if (body.kycStatus !== undefined) updates.kycStatus = body.kycStatus;
        if (body.role !== undefined) updates.role = body.role;
      }

      const [updatedUser] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, targetId))
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          phone: users.phone,
          role: users.role,
          kycStatus: users.kycStatus,
          isActive: users.isActive,
          updatedAt: users.updatedAt,
        });

      if (!updatedUser) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
          { status: 404 }
        );
      }

      return NextResponse.json<ApiResponse<typeof updatedUser>>({
        success: true,
        data: updatedUser,
        message: "User profile updated successfully.",
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
  }
);
