import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse, PaginatedResponse } from "@/lib/types/api";
import { Property } from "@/lib/types/task";
import { getDb } from "@/lib/db/client";
import { properties } from "@/db/schema";
import { eq } from "drizzle-orm";

const db = getDb();

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const searchParams = req.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  const dbProperties = await db.select().from(properties).where(eq(properties.userId, user.sub)).limit(limit).offset((page - 1) * limit);

  // Convert dates to string to match Property type
  const mappedProperties: Property[] = dbProperties.map(p => ({
    ...p,
    latitude: p.latitude ? parseFloat(p.latitude) : undefined,
    longitude: p.longitude ? parseFloat(p.longitude) : undefined,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString()
  }));

  return NextResponse.json<PaginatedResponse<Property>>({
    success: true,
    data: mappedProperties,
    pagination: {
      page,
      limit,
      total: mappedProperties.length, // Ideally count query here
      totalPages: 1,
    },
  });
});

export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const { title, address, latitude, longitude, parcelNumber, propertyType, description } = body;

    if (!title || !address) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Title and address are required" },
        },
        { status: 400 }
      );
    }

    const [newProp] = await db.insert(properties).values({
      userId: user.sub,
      title,
      address,
      latitude,
      longitude,
      parcelNumber,
      propertyType,
      description,
    }).returning();

    const createdProp: Property = {
      ...newProp,
      latitude: newProp.latitude ? parseFloat(newProp.latitude) : undefined,
      longitude: newProp.longitude ? parseFloat(newProp.longitude) : undefined,
      createdAt: newProp.createdAt.toISOString(),
      updatedAt: newProp.updatedAt.toISOString(),
    };

    return NextResponse.json<ApiResponse<Property>>(
      {
        success: true,
        data: createdProp,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: (error as Error).message },
      },
      { status: 500 }
    );
  }
});
