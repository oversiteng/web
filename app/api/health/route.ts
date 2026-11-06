import { NextResponse } from "next/server";
import { getDbReady } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDbReady();
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "degraded",
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}

