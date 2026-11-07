import { NextResponse } from "next/server";
import { ApiResponse } from "@/lib/types/api";

export async function POST(): Promise<NextResponse<ApiResponse<{ loggedOut: boolean }>>> {
  const response = NextResponse.json<ApiResponse<{ loggedOut: boolean }>>({
    success: true,
    data: { loggedOut: true },
    message: "Logged out successfully",
  });

  // Clear HTTP cookie
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });

  return response;
}
