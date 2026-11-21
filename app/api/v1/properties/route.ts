import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse, PaginatedResponse } from "@/lib/types/api";
import { Property, PropertyWithCurrentTask } from "@/lib/types/task";
import { getDbReady } from "@/lib/db/client";
import { properties, tasks, taskMilestones, taskChats, users, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  enrichPropertiesWithCurrentTasks,
  getDefaultPropertyIntelTimeline,
  parsePropertyDescriptionMeta,
} from "@/lib/services/propertyTaskService";
import { geocodeAddress } from "@/lib/services/geocodingService";

export const GET = withAuth(async (req: NextRequest, { user }) => {
  try {
    const db = await getDbReady();
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
  } catch (error) {
    console.error("GET /properties error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: (error as Error).message },
      },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const db = await getDbReady();
    const body = await req.json();
    const {
      title,
      address,
      latitude,
      longitude,
      parcelNumber,
      propertyType,
      description,
      ownershipType,
      proofOfOwnershipUrl,
      baselinePhotos,
    } = body;

    if (!title || !address) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Title and address are required" },
        },
        { status: 400 }
      );
    }

    // Check user subscription property quota & anti-abuse recent-deletion window
    const [ownerRows, existingUserProperties] = await Promise.all([
      db
        .select({
          id: users.id,
          role: users.role,
          accreditationDocuments: users.accreditationDocuments,
        })
        .from(users)
        .where(eq(users.id, user.sub))
        .limit(1),
      db
        .select({ id: properties.id })
        .from(properties)
        .where(eq(properties.userId, user.sub)),
    ]);

    const ownerDocs =
      ownerRows[0]?.accreditationDocuments &&
      typeof ownerRows[0].accreditationDocuments === "object"
        ? (ownerRows[0].accreditationDocuments as Record<string, any>)
        : {};

    const subscriptionTier = String(ownerDocs.subscriptionTier || "STANDARD").toUpperCase();
    const maxPropertyQuota =
      typeof ownerDocs.maxPropertiesQuota === "number"
        ? ownerDocs.maxPropertiesQuota
        : subscriptionTier === "BASIC"
        ? 2
        : subscriptionTier === "PREMIUM" || subscriptionTier === "ENTERPRISE"
        ? 15
        : 5;

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentDeletes: Array<{ deletedAt: string }> = Array.isArray(
      ownerDocs.recentPropertyDeletions
    )
      ? ownerDocs.recentPropertyDeletions.filter(
          (d: any) => d?.deletedAt && new Date(d.deletedAt).getTime() > thirtyDaysAgo
        )
      : [];

    const effectiveQuotaUsed = existingUserProperties.length + recentDeletes.length;
    if (
      user.role === "USER" &&
      effectiveQuotaUsed >= maxPropertyQuota
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "QUOTA_EXCEEDED",
            message: `You have reached your ${subscriptionTier} plan property monitoring limit (${maxPropertyQuota} properties, including properties removed within the current 30-day cycle). Upgrade your plan or contact Oversite Support to add more properties.`,
          },
        },
        { status: 403 }
      );
    }

    let finalLat = latitude ? String(latitude) : undefined;
    let finalLng = longitude ? String(longitude) : undefined;

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

    const effectiveOwnership: "OWNED" | "OTHER" =
      ownershipType === "OTHER" ? "OTHER" : "OWNED";
    const effectiveParcel =
      parcelNumber || (effectiveOwnership === "OTHER" ? "OTHER_WATCH" : "OWNED_TITLE");

    const serializedDescription = JSON.stringify({
      __meta: true,
      ownershipType: effectiveOwnership,
      reviewStatus: "PENDING_ADMIN_REVIEW",
      ownershipVerificationStatus:
        effectiveOwnership === "OWNED" ? "PENDING" : "PENDING_REVIEW",
      landmarkDescription: description || "",
      baselinePhotos: Array.isArray(baselinePhotos) ? baselinePhotos.slice(0, 3) : [],
      proofOfOwnershipUrl: proofOfOwnershipUrl || null,
      scheduleConfig: {
        cadence: subscriptionTier === "BASIC" ? "ANNUALLY" : "SEMI_ANNUALLY",
        autoDispenseEnabled: true,
        subscriptionTier,
      },
      intelTimeline: getDefaultPropertyIntelTimeline(),
    });

    const [newProp] = await db
      .insert(properties)
      .values({
        userId: user.sub,
        title,
        address,
        latitude: finalLat,
        longitude: finalLng,
        parcelNumber: effectiveParcel,
        propertyType,
        description: serializedDescription,
      })
      .returning();

    // Notify user that property is under Admin verification before monitoring tasks are dispatched
    await db
      .insert(notifications)
      .values({
        userId: user.sub,
        type: "SYSTEM",
        title: `Property Submitted for Review: ${title}`,
        body:
          effectiveOwnership === "OWNED"
            ? `Your property "${title}" (${address}) has been submitted to Central Operations for ownership & coordinate verification. Once approved, your Personal Property Manager will activate baseline monitoring.`
            : `Your Encroachment Watch listing "${title}" (${address}) has been submitted for coordinate & corridor verification. You will be notified as soon as monitoring is activated.`,
      })
      .catch(() => {});

    const meta = parsePropertyDescriptionMeta(newProp.description, newProp.parcelNumber);

    const createdProp: Property = {
      ...newProp,
      description: meta.description,
      ownershipType: meta.ownershipType,
      baselinePhotos: meta.baselinePhotos,
      proofOfOwnershipUrl: meta.proofOfOwnershipUrl,
      intelTimeline: meta.intelTimeline,
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
    const errMessage = (error as Error).message || "";
    if (errMessage.includes("violates foreign key constraint") && errMessage.includes("user_id")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message:
              "User account associated with this session no longer exists in database. Please re-authenticate.",
          },
        },
        { status: 401 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: errMessage },
      },
      { status: 500 }
    );
  }
});
