import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { getDbReady } from "@/lib/db/client";
import { users, outboundEmails, notifications } from "@/db/schema";
import { eq, inArray, desc } from "drizzle-orm";
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
 * GET /api/v1/admin/team
 * Lists all ADMIN and SUPER_ADMIN accounts with their Departmental RBAC policy & onboarding state.
 * Strictly restricted to SUPER_ADMIN.
 */
export const GET = withAuth(
  async () => {
    try {
      const db = await getDbReady();

      const adminRows = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          title: users.title,
          role: users.role,
          isActive: users.isActive,
          accreditationDocuments: users.accreditationDocuments,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(inArray(users.role, ["ADMIN", "SUPER_ADMIN"]))
        .orderBy(desc(users.createdAt));

      const staff = adminRows.map((row) => {
        const adminPolicy = extractAdminPolicy(row);
        return {
          id: row.id,
          name: row.name || "Unnamed Admin",
          email: row.email,
          phone: row.phone,
          title: row.title || adminPolicy.departmentLabel,
          role: row.role,
          isActive: row.isActive,
          adminPolicy,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        };
      });

      const summary = {
        totalStaff: staff.length,
        superAdmins: staff.filter((s) => s.role === "SUPER_ADMIN").length,
        pendingPassword: staff.filter(
          (s) => s.adminPolicy.onboardingStatus === "INVITED_PENDING_PASSWORD"
        ).length,
        pendingApproval: staff.filter(
          (s) => s.adminPolicy.onboardingStatus === "PENDING_APPROVAL"
        ).length,
        activeApproved: staff.filter(
          (s) => s.isActive && s.adminPolicy.onboardingStatus === "APPROVED"
        ).length,
        suspended: staff.filter(
          (s) => !s.isActive || s.adminPolicy.onboardingStatus === "SUSPENDED"
        ).length,
      };

      return NextResponse.json({
        success: true,
        data: {
          staff,
          departments: Object.values(ADMIN_DEPARTMENTS),
          summary,
        },
      });
    } catch (error) {
      console.error("[GET /api/v1/admin/team] Error:", error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to load admin team directory.",
          },
        },
        { status: 500 }
      );
    }
  },
  { roles: ["SUPER_ADMIN"] }
);

/**
 * POST /api/v1/admin/team
 * Step 1 of the 3-Step Admin Onboarding Handshake:
 * SUPER_ADMIN creates a new Departmental Admin, assigns initial department & CRUD flags,
 * and dispatches temporary login credentials to their email.
 */
export const POST = withAuth(
  async (req: NextRequest, { user }) => {
    try {
      const db = await getDbReady();
      const body = await req.json().catch(() => ({}));

      const name = String(body.name || "").trim();
      const email = String(body.email || "")
        .trim()
        .toLowerCase();
      const phone = body.phone ? String(body.phone).trim() : null;
      const departmentKey: AdminDepartment =
        body.department && ADMIN_DEPARTMENTS[body.department as AdminDepartment]
          ? (body.department as AdminDepartment)
          : "ADMINISTRATIVE";
      const role: "ADMIN" | "SUPER_ADMIN" =
        body.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN";

      if (!name || !email || !email.includes("@")) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Valid full name and official email address are required.",
            },
          },
          { status: 400 }
        );
      }

      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existing.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "CONFLICT",
              message: "An account with this email address already exists.",
            },
          },
          { status: 409 }
        );
      }

      const deptDef =
        role === "SUPER_ADMIN"
          ? ADMIN_DEPARTMENTS.EXECUTIVE
          : ADMIN_DEPARTMENTS[departmentKey];

      const tempPassword = generateTempPassword();
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      const allowedModules =
        Array.isArray(body.allowedModules) && body.allowedModules.length > 0
          ? body.allowedModules.map(String)
          : deptDef.defaultModules;

      const adminPolicy: AdminPolicy = {
        department: role === "SUPER_ADMIN" ? "EXECUTIVE" : departmentKey,
        departmentLabel: deptDef.label,
        onboardingStatus: "INVITED_PENDING_PASSWORD",
        mustChangePassword: true,
        canRead: body.canRead !== undefined ? Boolean(body.canRead) : true,
        canWrite: body.canWrite !== undefined ? Boolean(body.canWrite) : true,
        canDelete:
          role === "SUPER_ADMIN"
            ? true
            : body.canDelete !== undefined
            ? Boolean(body.canDelete)
            : false,
        noExportOrCopy: true,
        allowedModules,
        invitedBy: user.sub,
        invitedAt: new Date().toISOString(),
      };

      const [created] = await db
        .insert(users)
        .values({
          name,
          email,
          phone,
          title: body.title ? String(body.title).trim() : deptDef.shortLabel,
          role,
          kycStatus: "VERIFIED",
          ninVerificationStatus: "verified",
          passwordHash,
          isActive: true,
          accreditationDocuments: {
            adminPolicy,
          },
        })
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
        });

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://oversite.Vc";
      const emailSubject = `Oversite Admin Credentials — ${deptDef.label}`;
      const emailBody = `Hello ${name},\n\nYou have been provisioned as an Oversite Administrator under the ${deptDef.label} department.\n\n1. Sign in at: ${appUrl}/admin/login\n2. Official Email: ${email}\n3. Temporary Password: ${tempPassword}\n\nUpon your first login, you will be required to update your password. Once updated, the Super Admin will approve your account and activate your departmental workspace.\n\nStrict Security Policy: No admin may copy, export, or download platform data of any kind.`;

      await db.insert(outboundEmails).values({
        userId: created.id,
        toAddress: email,
        subject: emailSubject,
        template: "ADMIN_INVITE_CREDENTIALS",
      });

      await sendEmailAsync({
        to: email,
        subject: emailSubject,
        template: "ADMIN_INVITE_CREDENTIALS",
        payload: {
          name,
          department: deptDef.label,
          loginUrl: `${appUrl}/admin/login`,
          tempPassword,
          body: emailBody,
        },
      }).catch(() => null);

      await db.insert(notifications).values({
        userId: created.id,
        title: `Welcome to ${deptDef.label}`,
        body: "Please complete your first-time password update at /admin/login so the Super Admin can approve your departmental access.",
        type: "SYSTEM",
      });

      return NextResponse.json({
        success: true,
        data: {
          staffMember: {
            id: created.id,
            name: created.name,
            email: created.email,
            role: created.role,
            adminPolicy,
            createdAt: created.createdAt,
          },
        },
        message: `Admin account created for ${email}. Temporary login credentials have been dispatched via email.`,
      });
    } catch (error) {
      console.error("[POST /api/v1/admin/team] Error:", error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to provision admin account.",
          },
        },
        { status: 500 }
      );
    }
  },
  { roles: ["SUPER_ADMIN"] }
);
