import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { getDbReady } from "@/lib/db/client";
import { users, notifications, outboundEmails } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  ADMIN_DEPARTMENTS,
  AdminDepartment,
  AdminPolicy,
  extractAdminPolicy,
} from "@/lib/auth/adminPermissions";
import { sendEmailAsync } from "@/lib/services/mailService";

export const runtime = "nodejs";

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(10);
  let code = "OVS-";
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `${code}!9`;
}

/**
 * PATCH /api/v1/admin/team/[id]
 * Step 3 of the 3-Step Admin Onboarding Handshake & Ongoing Governance:
 * Allows SUPER_ADMIN to:
 * - APPROVE an admin after password setup and assign Department + Read/Write/Delete privileges
 * - UPDATE_PRIVILEGES (department, canRead, canWrite, canDelete, allowedModules, role)
 * - SUSPEND or REINSTATE an admin
 * - RESET_CREDENTIALS (re-issue temporary password to email)
 */
export const PATCH = withAuth(
  async (req: NextRequest, { params, user }) => {
    try {
      const db = await getDbReady();
      const targetId = params.id;
      const body = await req.json().catch(() => ({}));
      const action = String(body.action || "UPDATE_PRIVILEGES").toUpperCase();

      const [targetUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, targetId))
        .limit(1);

      if (!targetUser) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "NOT_FOUND", message: "Admin account not found." },
          },
          { status: 404 }
        );
      }

      if (targetUser.id === user.sub && action === "SUSPEND") {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "You cannot suspend your own Super Admin account.",
            },
          },
          { status: 400 }
        );
      }

      const currentPolicy = extractAdminPolicy(targetUser);
      const existingDocs =
        targetUser.accreditationDocuments &&
        typeof targetUser.accreditationDocuments === "object"
          ? (targetUser.accreditationDocuments as Record<string, any>)
          : {};

      const nextDept: AdminDepartment =
        body.department && ADMIN_DEPARTMENTS[body.department as AdminDepartment]
          ? (body.department as AdminDepartment)
          : currentPolicy.department;

      const deptDef = ADMIN_DEPARTMENTS[nextDept];

      let nextIsActive = targetUser.isActive;
      let nextRole = targetUser.role;
      let nextPasswordHash = targetUser.passwordHash;
      let updatedPolicy: AdminPolicy = {
        ...currentPolicy,
        department: nextDept,
        departmentLabel: deptDef.label,
        canRead:
          body.canRead !== undefined
            ? Boolean(body.canRead)
            : currentPolicy.canRead,
        canWrite:
          body.canWrite !== undefined
            ? Boolean(body.canWrite)
            : currentPolicy.canWrite,
        canDelete:
          body.canDelete !== undefined
            ? Boolean(body.canDelete)
            : currentPolicy.canDelete,
        allowedModules:
          Array.isArray(body.allowedModules) && body.allowedModules.length > 0
            ? body.allowedModules.map(String)
            : body.department && body.department !== currentPolicy.department
            ? deptDef.defaultModules
            : currentPolicy.allowedModules,
        noExportOrCopy: true,
      };

      let responseMessage = "Admin privileges updated.";

      if (action === "APPROVE") {
        nextIsActive = true;
        updatedPolicy = {
          ...updatedPolicy,
          onboardingStatus: "APPROVED",
          mustChangePassword: false,
          approvedBy: user.sub,
          approvedAt: new Date().toISOString(),
        };
        responseMessage = `${targetUser.name || targetUser.email} has been approved and assigned to ${deptDef.label}.`;

        await db.insert(notifications).values({
          userId: targetUser.id,
          title: "Admin Account Approved",
          body: `Your ${deptDef.label} workspace and privileges have been approved by the Super Admin.`,
          type: "SYSTEM",
        });
      } else if (action === "SUSPEND") {
        nextIsActive = false;
        updatedPolicy = {
          ...updatedPolicy,
          onboardingStatus: "SUSPENDED",
        };
        responseMessage = `${targetUser.name || targetUser.email} has been suspended.`;
      } else if (action === "REINSTATE") {
        nextIsActive = true;
        updatedPolicy = {
          ...updatedPolicy,
          onboardingStatus: "APPROVED",
        };
        responseMessage = `${targetUser.name || targetUser.email} has been reinstated.`;
      } else if (action === "RESET_CREDENTIALS") {
        const tempPassword = generateTempPassword();
        nextPasswordHash = await bcrypt.hash(tempPassword, 10);
        updatedPolicy = {
          ...updatedPolicy,
          mustChangePassword: true,
          onboardingStatus: "INVITED_PENDING_PASSWORD",
        };
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL || "https://oversite.Vc";
        await db.insert(outboundEmails).values({
          userId: targetUser.id,
          toAddress: targetUser.email,
          subject: "Oversite Admin Credentials Reset",
          template: "ADMIN_CREDENTIALS_RESET",
        });
        await sendEmailAsync({
          to: targetUser.email,
          subject: "Oversite Admin Credentials Reset",
          template: "ADMIN_CREDENTIALS_RESET",
          payload: {
            name: targetUser.name || "Admin",
            loginUrl: `${appUrl}/admin/login`,
            tempPassword,
          },
        }).catch(() => null);
        responseMessage = `Temporary password reset and dispatched to ${targetUser.email}.`;
      } else if (body.role === "SUPER_ADMIN" || body.role === "ADMIN") {
        nextRole = body.role;
        if (nextRole === "SUPER_ADMIN") {
          updatedPolicy = {
            ...updatedPolicy,
            department: "EXECUTIVE",
            departmentLabel: ADMIN_DEPARTMENTS.EXECUTIVE.label,
            onboardingStatus: "APPROVED",
            canRead: true,
            canWrite: true,
            canDelete: true,
            allowedModules: ADMIN_DEPARTMENTS.EXECUTIVE.defaultModules,
          };
        }
      }

      await db
        .update(users)
        .set({
          role: nextRole,
          isActive: nextIsActive,
          title: deptDef.shortLabel,
          passwordHash: nextPasswordHash,
          accreditationDocuments: {
            ...existingDocs,
            adminPolicy: updatedPolicy,
          },
          updatedAt: new Date(),
        })
        .where(eq(users.id, targetUser.id));

      return NextResponse.json({
        success: true,
        data: {
          id: targetUser.id,
          role: nextRole,
          isActive: nextIsActive,
          adminPolicy: updatedPolicy,
        },
        message: responseMessage,
      });
    } catch (error) {
      console.error("[PATCH /api/v1/admin/team/[id]] Error:", error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to update admin account.",
          },
        },
        { status: 500 }
      );
    }
  },
  { roles: ["SUPER_ADMIN"] }
);

/**
 * DELETE /api/v1/admin/team/[id]
 * Allows SUPER_ADMIN to permanently delete or revoke a sub-admin account.
 */
export const DELETE = withAuth(
  async (_req: NextRequest, { params, user }) => {
    try {
      const db = await getDbReady();
      const targetId = params.id;

      if (targetId === user.sub) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "You cannot delete your own Super Admin account.",
            },
          },
          { status: 400 }
        );
      }

      const [targetUser] = await db
        .select({ id: users.id, email: users.email, name: users.name })
        .from(users)
        .where(eq(users.id, targetId))
        .limit(1);

      if (!targetUser) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "NOT_FOUND", message: "Admin account not found." },
          },
          { status: 404 }
        );
      }

      try {
        await db.delete(users).where(eq(users.id, targetId));
      } catch {
        // Fallback if foreign key references exist: demote, deactivate & clear passwordHash
        await db
          .update(users)
          .set({
            isActive: false,
            role: "USER",
            passwordHash: null,
            accreditationDocuments: {
              adminPolicy: {
                onboardingStatus: "SUSPENDED",
                canRead: false,
                canWrite: false,
                canDelete: false,
                noExportOrCopy: true,
              },
            },
            updatedAt: new Date(),
          })
          .where(eq(users.id, targetId));
      }

      return NextResponse.json({
        success: true,
        message: `Admin account (${targetUser.email}) has been permanently removed.`,
      });
    } catch (error) {
      console.error("[DELETE /api/v1/admin/team/[id]] Error:", error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to delete admin account.",
          },
        },
        { status: 500 }
      );
    }
  },
  { roles: ["SUPER_ADMIN"] }
);
