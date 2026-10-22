import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse, PaginatedResponse } from "@/lib/types/api";
import { Property, PropertyWithCurrentTask } from "@/lib/types/task";
import { getDb } from "@/lib/db/client";
import { properties } from "@/db/schema";
import { eq } from "drizzle-orm";
import { enrichPropertiesWithCurrentTasks } from "@/lib/services/propertyTaskService";
import { geocodeAddress } from "@/lib/services/geocodingService";

const db = getDb();

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const searchParams = req.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  const dbProperties = await db
    .select()
    .from(properties)
    .where(eq(properties.userId, user.sub))
    .limit(limit)
    .offset((page - 1) * limit);

  const enrichedProperties = await enrichPropertiesWithCurrentTasks(dbProperties, db);

  return NextResponse.json<PaginatedResponse<PropertyWithCurrentTask>>({
    success: true,
    data: enrichedProperties,
    pagination: {
      page,
      limit,
      total: enrichedProperties.length,
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

    let finalLat = latitude ? String(latitude) : undefined;
    let finalLng = longitude ? String(longitude) : undefined;

    // Automatically geocode address if coordinates are missing
    if ((!finalLat || !finalLng) && address) {
      try {
        const geo = await geocodeAddress(address);
        if (geo) {
          finalLat = String(geo.latitude);
          finalLng = String(geo.longitude);
        }
      } catch (err) {
        console.warn("Auto-geocoding property address fallback failed:", err);
      }
    }

    const [newProp] = await db.insert(properties).values({
      userId: user.sub,
      title,
      address,
      latitude: finalLat,
      longitude: finalLng,
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
