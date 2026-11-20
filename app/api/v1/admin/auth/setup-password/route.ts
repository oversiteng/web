import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { getDbReady } from "@/lib/db/client";
import { users, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { extractAdminPolicy, AdminPolicy } from "@/lib/auth/adminPermissions";

export const runtime = "nodejs";

/**
 * POST /api/v1/admin/auth/setup-password
 * Step 2 of the 3-step Admin Onboarding Handshake:
 * Newly invited Admin updates their temporary password, transitioning from
 * INVITED_PENDING_PASSWORD -> PENDING_APPROVAL and notifying SUPER_ADMINs.
 */
export const POST = withAuth(
  async (req: NextRequest, { user }) => {
    try {
      const db = await getDbReady();
      const body = await req.json().catch(() => ({}));
      const currentPassword =
        typeof body.currentPassword === "string" ? body.currentPassword : "";
      const newPassword =
        typeof body.newPassword === "string" ? body.newPassword : "";

      if (!newPassword || newPassword.length < 8) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "New password must be at least 8 characters long.",
            },
          },
          { status: 400 }
        );
      }

      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, user.sub))
        .limit(1);

      if (!dbUser) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "NOT_FOUND", message: "Admin account not found." },
          },
          { status: 404 }
        );
      }

      if (dbUser.passwordHash) {
        if (!currentPassword) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "VALIDATION_ERROR",
                message: "Current temporary password is required.",
              },
            },
            { status: 400 }
          );
        }
        const matchesCurrent = await bcrypt.compare(
          currentPassword,
          dbUser.passwordHash
        );
        if (!matchesCurrent) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "UNAUTHORIZED",
                message: "Current temporary password is incorrect.",
              },
            },
            { status: 401 }
          );
        }
      }

      const sameAsOld = dbUser.passwordHash
        ? await bcrypt.compare(newPassword, dbUser.passwordHash)
        : false;
      if (sameAsOld) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message:
                "Your new password must be different from the temporary password.",
            },
          },
          { status: 400 }
        );
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      const currentPolicy = extractAdminPolicy(dbUser);

      const nextStatus =
        dbUser.role === "SUPER_ADMIN"
          ? "APPROVED"
          : currentPolicy.onboardingStatus === "APPROVED"
          ? "APPROVED"
          : "PENDING_APPROVAL";

      const updatedPolicy: AdminPolicy = {
        ...currentPolicy,
        mustChangePassword: false,
        onboardingStatus: nextStatus,
        passwordUpdatedAt: new Date().toISOString(),
        noExportOrCopy: true,
      };

      const existingDocs =
        dbUser.accreditationDocuments &&
        typeof dbUser.accreditationDocuments === "object"
          ? (dbUser.accreditationDocuments as Record<string, any>)
          : {};

      await db
        .update(users)
        .set({
          passwordHash: newPasswordHash,
          accreditationDocuments: {
            ...existingDocs,
            adminPolicy: updatedPolicy,
          },
          updatedAt: new Date(),
        })
        .where(eq(users.id, dbUser.id));

      // Notify all SUPER_ADMINs that this admin has completed password setup and is awaiting approval
      if (nextStatus === "PENDING_APPROVAL") {
        const superAdmins = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.role, "SUPER_ADMIN"));

        if (superAdmins.length > 0) {
          await db.insert(notifications).values(
            superAdmins.map((sa) => ({
              userId: sa.id,
              title: "Admin Onboarding Awaiting Approval",
              body: `${dbUser.name || dbUser.email} (${updatedPolicy.departmentLabel}) has updated their temporary password and is awaiting Super Admin approval & privilege assignment.`,
              type: "ALERT" as const,
            }))
          );
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          adminPolicy: updatedPolicy,
        },
        message:
          nextStatus === "PENDING_APPROVAL"
            ? "Password updated! Your account is now awaiting Super Admin approval and department privilege activation."
            : "Password updated successfully.",
      });
    } catch (error) {
      console.error("[POST /api/v1/admin/auth/setup-password] Error:", error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to update admin password.",
          },
        },
        { status: 500 }
      );
    }
  },
  { roles: ["ADMIN", "SUPER_ADMIN"] }
);
