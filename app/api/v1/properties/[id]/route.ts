import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { Property } from "@/lib/types/task";

export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, { params }) => {
    // TODO: Fetch property from db
    const mockProperty: Property = {
      id: params.id,
      userId: "00000000-0000-0000-0000-000000000001",
      title: "Sample Registered Property",
      address: "Plot 12, Lekki Phase 1, Lagos",
      latitude: 6.4474,
      longitude: 3.4723,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json<ApiResponse<Property>>({
      success: true,
      data: mockProperty,
    });
  }
);

export const PATCH = withAuth<{ id: string }>(
  async (req: NextRequest, { params }) => {
    const body = await req.json();
    // TODO: Update property in db

    return NextResponse.json<ApiResponse<{ updated: boolean }>>({
      success: true,
      data: { updated: true },
    });
  }
);

export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, { params }) => {
    // TODO: Delete property from db
    return NextResponse.json<ApiResponse<{ deleted: boolean }>>({
      success: true,
      data: { deleted: true },
    });
  }
);
