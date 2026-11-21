import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { Property, PropertyWithCurrentTask, Task, TaskModule, TaskStatus } from "@/lib/types/task";
import { getDbReady } from "@/lib/db/client";
import { properties, tasks, taskMilestones, taskChats, users } from "@/db/schema";
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
      let rawMetaObj: Record<string, any> = {};
      if (prop.description && prop.description.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(prop.description);
          if (parsed && parsed.__meta) rawMetaObj = parsed;
        } catch {}
      }

      const dbTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.propertyId, prop.id))
        .orderBy(desc(tasks.createdAt));

      let assignedManager: {
        id: string;
        name: string | null;
        email: string;
        role: string;
        avatarUrl?: string | null;
      } | null = null;
      if (rawMetaObj.assignedAgentId) {
        const mgrRows = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            avatarUrl: users.avatarUrl,
          })
          .from(users)
          .where(eq(users.id, rawMetaObj.assignedAgentId))
          .limit(1);
        if (mgrRows[0]) assignedManager = mgrRows[0];
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

      const propertyData: PropertyWithTasks & Record<string, any> = {
        ...prop,
        description: meta.description,
        ownershipType: meta.ownershipType,
        baselinePhotos: meta.baselinePhotos,
        proofOfOwnershipUrl: meta.proofOfOwnershipUrl,
        intelTimeline: meta.intelTimeline,
        reviewStatus:
          rawMetaObj.reviewStatus ||
          (rawMetaObj.ownershipVerificationStatus === "VERIFIED" || dbTasks.length > 0
            ? "APPROVED"
            : "PENDING_ADMIN_REVIEW"),
        ownershipVerificationStatus:
          rawMetaObj.ownershipVerificationStatus ||
          (meta.ownershipType === "OWNED" ? "PENDING" : "PENDING_REVIEW"),
        scheduleConfig: rawMetaObj.scheduleConfig || {
          cadence: "SEMI_ANNUALLY",
          autoDispenseEnabled: true,
          subscriptionTier: "STANDARD",
        },
        assignedManager,
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
      const {
        title,
        address,
        latitude,
        longitude,
        parcelNumber,
        propertyType,
        description,
        baselinePhotos,
      } = body;

      const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

      const [existingProp] = await db
        .select()
        .from(properties)
        .where(
          and(
            eq(properties.id, id),
            isAdmin ? undefined : eq(properties.userId, user.sub)
          )
        )
        .limit(1);

      if (!existingProp) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Property not found" } },
          { status: 404 }
        );
      }

      const propTasks = await db
        .select({ id: tasks.id, status: tasks.status })
        .from(tasks)
        .where(eq(tasks.propertyId, id));

      let parsedMeta: Record<string, any> = {};
      if (existingProp.description && existingProp.description.trim().startsWith("{")) {
        try {
          const p = JSON.parse(existingProp.description);
          if (p && p.__meta) parsedMeta = p;
        } catch {}
      }

      const isIdentityLocked =
        !isAdmin &&
        (parsedMeta.ownershipVerificationStatus === "VERIFIED" ||
          parsedMeta.reviewStatus === "APPROVED" ||
          propTasks.length > 0);

      if (
        isIdentityLocked &&
        ((address && address.trim() !== existingProp.address.trim()) ||
          (parcelNumber && parcelNumber !== existingProp.parcelNumber))
      ) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "PROPERTY_IDENTITY_LOCKED",
              message:
                "Property physical address and title parcel cannot be altered once verification or field tasks have commenced. You may still update the property nickname, landmark notes, and photos.",
            },
          },
          { status: 400 }
        );
      }

      const nextAddress = isIdentityLocked ? existingProp.address : address ?? existingProp.address;
      const nextParcel = isIdentityLocked
        ? existingProp.parcelNumber
        : parcelNumber ?? existingProp.parcelNumber;

      let finalLat = isIdentityLocked
        ? existingProp.latitude ?? undefined
        : latitude
        ? String(latitude)
        : existingProp.latitude ?? undefined;
      let finalLng = isIdentityLocked
        ? existingProp.longitude ?? undefined
        : longitude
        ? String(longitude)
        : existingProp.longitude ?? undefined;

      if (!isIdentityLocked && (!finalLat || !finalLng) && nextAddress) {
        try {
          const geo = await geocodeAddress(nextAddress);
          if (geo) {
            finalLat = String(geo.latitude);
            finalLng = String(geo.longitude);
          }
        } catch (err) {
          console.warn("Auto-geocoding fallback in property update failed:", err);
        }
      }

      let mergedDescription = existingProp.description;
      if (parsedMeta.__meta) {
        mergedDescription = JSON.stringify({
          ...parsedMeta,
          ...(description !== undefined
            ? { landmarkDescription: description, text: description, description }
            : {}),
          ...(Array.isArray(baselinePhotos)
            ? { baselinePhotos: baselinePhotos.slice(0, 6) }
            : {}),
        });
      } else if (description !== undefined) {
        mergedDescription = description;
      }

      const [updatedProp] = await db
        .update(properties)
        .set({
          title: title ?? existingProp.title,
          address: nextAddress,
          latitude: finalLat,
          longitude: finalLng,
          parcelNumber: nextParcel,
          propertyType: propertyType ?? existingProp.propertyType,
          description: mergedDescription,
          updatedAt: new Date(),
        })
        .where(eq(properties.id, id))
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

      // Verify ownership before unlinking tasks and deleting property
      const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
      const [existingProp] = await db
        .select({
          id: properties.id,
          userId: properties.userId,
          title: properties.title,
          createdAt: properties.createdAt,
        })
        .from(properties)
        .where(
          and(
            eq(properties.id, id),
            isAdmin ? undefined : eq(properties.userId, user.sub)
          )
        )
        .limit(1);

      if (!existingProp) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Property not found" } },
          { status: 404 }
        );
      }

      const propTasks = await db
        .select({ id: tasks.id, status: tasks.status, title: tasks.title })
        .from(tasks)
        .where(eq(tasks.propertyId, id));

      const activeBlockingStatuses = new Set([
        "MATCHED",
        "AGENT_EN_ROUTE",
        "AGENT_ON_SITE",
        "IN_PROGRESS",
        "REPORT_SUBMITTED",
        "UNDER_REVIEW",
      ]);

      const activeTasksOnProperty = propTasks.filter((t) =>
        activeBlockingStatuses.has(t.status)
      );

      if (!isAdmin && activeTasksOnProperty.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "ACTIVE_TASKS_EXIST",
              message: `This property cannot be deleted while an active field task ("${activeTasksOnProperty[0].title}") is in progress or under review.`,
            },
          },
          { status: 400 }
        );
      }

      // Record deletion in user's 30-day anti-abuse quota ledger
      if (!isAdmin) {
        const [ownerRow] = await db
          .select({ accreditationDocuments: users.accreditationDocuments })
          .from(users)
          .where(eq(users.id, existingProp.userId))
          .limit(1);
        const docs =
          ownerRow?.accreditationDocuments &&
          typeof ownerRow.accreditationDocuments === "object"
            ? { ...(ownerRow.accreditationDocuments as Record<string, any>) }
            : {};
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const recent = Array.isArray(docs.recentPropertyDeletions)
          ? docs.recentPropertyDeletions.filter(
              (d: any) => d?.deletedAt && new Date(d.deletedAt).getTime() > thirtyDaysAgo
            )
          : [];
        recent.push({
          propertyId: existingProp.id,
          title: existingProp.title,
          deletedAt: new Date().toISOString(),
        });
        docs.recentPropertyDeletions = recent;
        await db
          .update(users)
          .set({ accreditationDocuments: docs, updatedAt: new Date() })
          .where(eq(users.id, existingProp.userId));
      }

      // Cancel any remaining PENDING tasks for this property and unlink
      await db
        .update(tasks)
        .set({ propertyId: null, status: "CANCELLED", updatedAt: new Date() })
        .where(eq(tasks.propertyId, id));

      await db.delete(properties).where(eq(properties.id, id));

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
