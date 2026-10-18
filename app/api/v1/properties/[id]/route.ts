import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { Property, Task, TaskModule, TaskStatus } from "@/lib/types/task";
import { getDb } from "@/lib/db/client";
import { properties, tasks } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

const db = getDb();

export interface PropertyWithTasks extends Property {
  tasks: Task[];
  activeTaskCount: number;
}

export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const { id } = await params;

      // 1. Fetch property from DB
      const propRecords = await db
        .select()
        .from(properties)
        .where(
          and(
            eq(properties.id, id),
            user.role === "ADMIN" ? undefined : eq(properties.userId, user.sub)
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

      // 2. Fetch all tasks linked to this property
      const dbTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.propertyId, prop.id))
        .orderBy(desc(tasks.createdAt));

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

      const propertyData: PropertyWithTasks = {
        ...prop,
        latitude: prop.latitude ? parseFloat(prop.latitude) : undefined,
        longitude: prop.longitude ? parseFloat(prop.longitude) : undefined,
        createdAt: prop.createdAt.toISOString(),
        updatedAt: prop.updatedAt.toISOString(),
        tasks: mappedTasks,
        activeTaskCount: activeTasks.length,
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
      const body = await req.json();
      const { title, address, latitude, longitude, parcelNumber, propertyType, description } = body;

      const [updatedProp] = await db
        .update(properties)
        .set({
          title,
          address,
          latitude: latitude ? String(latitude) : undefined,
          longitude: longitude ? String(longitude) : undefined,
          parcelNumber,
          propertyType,
          description,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(properties.id, id),
            user.role === "ADMIN" ? undefined : eq(properties.userId, user.sub)
          )
        )
        .returning();

      if (!updatedProp) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Property not found" } },
          { status: 404 }
        );
      }

      return NextResponse.json<ApiResponse<Property>>({
        success: true,
        data: {
          ...updatedProp,
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

      await db
        .delete(properties)
        .where(
          and(
            eq(properties.id, id),
            user.role === "ADMIN" ? undefined : eq(properties.userId, user.sub)
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
