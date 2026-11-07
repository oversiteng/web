import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { LegalConsultation } from "@/lib/types/task";
import { getDb } from "@/lib/db/client";
import { legalConsultations, tasks } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

const db = getDb();

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const isSuper = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  const baseQuery = db
    .select({
      id: legalConsultations.id,
      taskId: legalConsultations.taskId,
      lawyerAgentId: legalConsultations.lawyerAgentId,
      scheduledAt: legalConsultations.scheduledAt,
      durationMins: legalConsultations.durationMins,
      retainerAmountNgn: legalConsultations.retainerAmountNgn,
      status: legalConsultations.status,
      notes: legalConsultations.notes,
      createdAt: legalConsultations.createdAt,
    })
    .from(legalConsultations)
    .innerJoin(tasks, eq(legalConsultations.taskId, tasks.id));

  const rows = await baseQuery
    .where(isSuper ? undefined : eq(tasks.userId, user.sub))
    .orderBy(desc(legalConsultations.createdAt));

  const formatted: LegalConsultation[] = rows.map((r) => ({
    id: r.id,
    taskId: r.taskId,
    lawyerAgentId: r.lawyerAgentId,
    scheduledAt: r.scheduledAt ? r.scheduledAt.toISOString() : null,
    durationMins: r.durationMins,
    retainerAmountNgn: r.retainerAmountNgn ? parseFloat(r.retainerAmountNgn) : null,
    status: r.status as any,
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
  }));

  return NextResponse.json<ApiResponse<LegalConsultation[]>>({
    success: true,
    data: formatted,
  });
});

export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const { lawyerAgentId, scheduledAt, durationMins, notes, legalArea, description } = body;

    // 1. Create task entry with module LEGAL_ADVISORY
    const [createdTask] = await db
      .insert(tasks)
      .values({
        userId: user.sub,
        moduleType: "LEGAL_ADVISORY",
        title: `Legal Advisory: ${legalArea || "General Consultation"}`,
        description: description || notes || "Legal counsel consultation retainer",
        status: "PENDING",
        formData: {
          legalArea: legalArea || "General",
          lawyerAgentId: lawyerAgentId || null,
        },
      })
      .returning();

    // 2. Create legal consultation record
    const [created] = await db
      .insert(legalConsultations)
      .values({
        taskId: createdTask.id,
        lawyerAgentId: lawyerAgentId || user.sub, // Fallback if general booking
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
        durationMins: durationMins || 60,
        retainerAmountNgn: "50000.00",
        status: "SCHEDULED",
        notes: notes || description || null,
      })
      .returning();

    const formatted: LegalConsultation = {
      id: created.id,
      taskId: created.taskId,
      lawyerAgentId: created.lawyerAgentId,
      scheduledAt: created.scheduledAt ? created.scheduledAt.toISOString() : null,
      durationMins: created.durationMins,
      retainerAmountNgn: created.retainerAmountNgn ? parseFloat(created.retainerAmountNgn) : 50000,
      status: created.status as any,
      notes: created.notes,
      createdAt: created.createdAt.toISOString(),
    };

    return NextResponse.json<ApiResponse<LegalConsultation>>(
      {
        success: true,
        data: formatted,
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
