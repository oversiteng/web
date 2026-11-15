import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse, PaginatedResponse } from "@/lib/types/api";
import { Property, PropertyWithCurrentTask } from "@/lib/types/task";
import { getDbReady } from "@/lib/db/client";
import { properties, tasks, taskMilestones, taskChats } from "@/db/schema";
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
      landmarkDescription: description || "",
      baselinePhotos: Array.isArray(baselinePhotos) ? baselinePhotos.slice(0, 3) : [],
      proofOfOwnershipUrl: proofOfOwnershipUrl || null,
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

    // Immediately dispense the Property Oversight task for Admin to assign an agent and submit property intelligence
    try {
      const [dispensedTask] = await db
        .insert(tasks)
        .values({
          userId: user.sub,
          propertyId: newProp.id,
          moduleType: "PROPERTY_OVERSITE",
          status: "PENDING",
          priority: "normal",
          title: `Property Oversight: ${title}`,
          description:
            description ||
            `Continuous property intelligence, community inquiry ("Word on the Street"), statutory layout directives, and vicinity landmark verification for ${title} (${address}).`,
          locationAddress: address,
          locationLat: finalLat,
          locationLng: finalLng,
          priceNgn: "15000",
          pricingMode: "AUTO_STANDARD",
          quoteStatus: "PAID_ESCROW",
          pricingBreakdown: {
            agentPayoutNgn: 10500,
            platformMarginNgn: 4500,
            isAgentPayExplicitlySet: true,
          },
          formData: {
            isPropertyIntelTask: true,
            propertyId: newProp.id,
            propertyTitle: title,
            ownershipType: effectiveOwnership,
            landmarkDescription: description || "",
          },
        })
        .returning();

      if (dispensedTask) {
        await db.insert(taskMilestones).values([
          {
            taskId: dispensedTask.id,
            title: "1. Physical Site Summary & Geofence Verification",
            description:
              "Verify perimeter fence, occupancy status, setback compliance, and capture geo-tagged baseline photographs.",
            orderIndex: 1,
            status: "IN_PROGRESS",
            completionPct: 50,
          },
          {
            taskId: dispensedTask.id,
            title: "2. Word on the Street (Community & Neighbor Inquiries)",
            description:
              "Interview caretakers and adjacent property managers to verify absence of communal disputes or encroachment.",
            orderIndex: 2,
            status: "PENDING",
            completionPct: 0,
          },
          {
            taskId: dispensedTask.id,
            title: "3. Statutory Layout Directives & Vicinity Landmarks",
            description:
              "Verify state physical planning compliance, surveyor general beacon coordinates, and vicinity transit landmarks.",
            orderIndex: 3,
            status: "PENDING",
            completionPct: 0,
          },
        ]);

        await db.insert(taskChats).values({
          taskId: dispensedTask.id,
          senderId: user.sub,
          receiverId: user.sub,
          rawMessage: `Oversite Property Intelligence task dispensed for "${title}". You are connected directly with Oversite regarding this property. Request site updates or ask questions here anytime.`,
          moderatedMessage: `Oversite Property Intelligence task dispensed for "${title}". You are connected directly with Oversite regarding this property. Request site updates or ask questions here anytime.`,
          message: `Oversite Property Intelligence task dispensed for "${title}". You are connected directly with Oversite regarding this property. Request site updates or ask questions here anytime.`,
          messageType: "TEXT",
          isModerated: true,
          moderationStatus: "APPROVED_AS_IS",
        });
      }
    } catch (taskErr) {
      console.warn("Auto-dispensing property oversight task failed:", taskErr);
    }

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
