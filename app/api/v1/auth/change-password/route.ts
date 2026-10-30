import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { PUT as changePasswordPut } from "@/app/api/v1/users/me/password/route";

export const POST = withAuth(async (req: NextRequest, ctx) => {
  return changePasswordPut(req, ctx);
});

export const PUT = withAuth(async (req: NextRequest, ctx) => {
  return changePasswordPut(req, ctx);
});
