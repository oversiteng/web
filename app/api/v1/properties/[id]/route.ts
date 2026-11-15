import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { Property, PropertyWithCurrentTask, Task, TaskModule, TaskStatus } from "@/lib/types/task";
import { getDbReady } from "@/lib/db/client";
import { properties, tasks, taskMilestones, taskChats } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  enrichPropertiesWithCurrentTasks,
  parsePropertyDescriptionMeta,
} from "@/lib/services/propertyTaskService";
import { geocodeAddress } from "@/lib/services/geocodingService";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface PropertyWithTasks extends PropertyWithCurrentTask {
  tasks: Task[];
  activeTaskCount: number;
}

export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const { id } = await params;

      if (!id || !UUID_REGEX.test(id)) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Property not found" } },
          { status: 404 }
        );
      }

      const db = await getDbReady();

      const propRecords = await db
        .select()
        .from(properties)
        .where(
          and(
            eq(properties.id, id),
            user.role === "ADMIN" || user.role === "SUPER_ADMIN"
              ? undefined
              : eq(properties.userId, user.sub)
          )
        )
        .limit(1);

      if (propRecords.length === 0) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Property not found" } },
          { status: 404 }
        );
      }

      const prop = propRecords[0];
      const meta = parsePropertyDescriptionMeta(prop.description, prop.parcelNumber);

      let dbTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.propertyId, prop.id))
        .orderBy(desc(tasks.createdAt));

      // Ensure every registered property has its dispensed Property Oversight task
      if (dbTasks.length === 0) {
        try {
          const [dispensedTask] = await db
            .insert(tasks)
            .values({
              userId: prop.userId,
              propertyId: prop.id,
              moduleType: "PROPERTY_OVERSITE",
              status: "PENDING",
              priority: "normal",
              title: `Property Oversight: ${prop.title}`,
              description:
                meta.description ||
                `Continuous property intelligence, community inquiry ("Word on the Street"), statutory layout directives, and vicinity landmark verification for ${prop.title} (${prop.address}).`,
              locationAddress: prop.address,
              locationLat: prop.latitude,
              locationLng: prop.longitude,
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
                propertyId: prop.id,
                propertyTitle: prop.title,
                ownershipType: meta.ownershipType,
                landmarkDescription: meta.description || "",
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
              senderId: prop.userId,
              receiverId: prop.userId,
              rawMessage: `Oversite Property Intelligence task dispensed for "${prop.title}". You are connected directly with Oversite regarding this property.`,
              moderatedMessage: `Oversite Property Intelligence task dispensed for "${prop.title}". You are connected directly with Oversite regarding this property.`,
              message: `Oversite Property Intelligence task dispensed for "${prop.title}". You are connected directly with Oversite regarding this property.`,
              messageType: "TEXT",
              isModerated: true,
              moderationStatus: "APPROVED_AS_IS",
            });

            dbTasks = [dispensedTask];
          }
        } catch (err) {
          console.warn("Could not auto-dispense missing property task:", err);
        }
      }

      const mappedTasks: Task[] = dbTasks.map((t) => ({
        ...t,
        moduleType: t.moduleType as TaskModule,
        status: t.status as TaskStatus,
        priority: t.priority ?? "normal",
        formData: (t.formData as Record<string, unknown>) ?? null,
        locationLat: t.locationLat ? parseFloat(t.locationLat) : undefined,
        locationLng: t.locationLng ? parseFloat(t.locationLng) : undefined,
        priceNgn: t.priceNgn ? parseFloat(t.priceNgn) : undefined,
        scheduledAt: t.scheduledAt ? t.scheduledAt.toISOString() : null,
        completedAt: t.completedAt ? t.completedAt.toISOString() : null,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt ? t.updatedAt.toISOString() : undefined,
      }));

      const activeTasks = mappedTasks.filter(
        (t) => t.status !== "COMPLETED" && t.status !== "CANCELLED"
      );

      const [enriched] = await enrichPropertiesWithCurrentTasks([prop], db);

      const propertyData: PropertyWithTasks = {
        ...prop,
        description: meta.description,
        ownershipType: meta.ownershipType,
        baselinePhotos: meta.baselinePhotos,
        proofOfOwnershipUrl: meta.proofOfOwnershipUrl,
        intelTimeline: meta.intelTimeline,
        latitude: prop.latitude ? parseFloat(prop.latitude) : undefined,
        longitude: prop.longitude ? parseFloat(prop.longitude) : undefined,
        createdAt: prop.createdAt.toISOString(),
        updatedAt: prop.updatedAt.toISOString(),
        tasks: mappedTasks,
        activeTaskCount: activeTasks.length,
        totalTaskCount: mappedTasks.length,
        currentTask: enriched?.currentTask || null,
      };

      return NextResponse.json<ApiResponse<PropertyWithTasks>>({
        success: true,
        data: propertyData,
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INTERNAL_ERROR", message: (error as Error).message },
        },
        { status: 500 }
      );
    }
  }
);

export const PATCH = withAuth<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const { id } = await params;

      if (!id || !UUID_REGEX.test(id)) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Property not found" } },
          { status: 404 }
        );
      }

      const db = await getDbReady();
      const body = await req.json();
      const { title, address, latitude, longitude, parcelNumber, propertyType, description } = body;

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
          console.warn("Auto-geocoding fallback in property update failed:", err);
        }
      }

      const [updatedProp] = await db
        .update(properties)
        .set({
          title,
          address,
          latitude: finalLat,
          longitude: finalLng,
          parcelNumber,
          propertyType,
          description,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(properties.id, id),
            user.role === "ADMIN" || user.role === "SUPER_ADMIN"
              ? undefined
              : eq(properties.userId, user.sub)
          )
        )
        .returning();

      if (!updatedProp) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Property not found" } },
          { status: 404 }
        );
      }

      const meta = parsePropertyDescriptionMeta(updatedProp.description, updatedProp.parcelNumber);

      return NextResponse.json<ApiResponse<Property>>({
        success: true,
        data: {
          ...updatedProp,
          description: meta.description,
          ownershipType: meta.ownershipType,
          baselinePhotos: meta.baselinePhotos,
          proofOfOwnershipUrl: meta.proofOfOwnershipUrl,
          intelTimeline: meta.intelTimeline,
          latitude: updatedProp.latitude ? parseFloat(updatedProp.latitude) : undefined,
          longitude: updatedProp.longitude ? parseFloat(updatedProp.longitude) : undefined,
          createdAt: updatedProp.createdAt.toISOString(),
          updatedAt: updatedProp.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INTERNAL_ERROR", message: (error as Error).message },
        },
        { status: 500 }
      );
    }
  }
);

export const PUT = PATCH;

export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const { id } = await params;

      if (!id || !UUID_REGEX.test(id)) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Property not found" } },
          { status: 404 }
        );
      }

      const db = await getDbReady();
      await db
        .delete(properties)
        .where(
          and(
            eq(properties.id, id),
            user.role === "ADMIN" || user.role === "SUPER_ADMIN"
              ? undefined
              : eq(properties.userId, user.sub)
          )
        );

      return NextResponse.json<ApiResponse<{ deleted: boolean }>>({
        success: true,
        data: { deleted: true },
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INTERNAL_ERROR", message: (error as Error).message },
        },
        { status: 500 }
      );
    }
  }
);
