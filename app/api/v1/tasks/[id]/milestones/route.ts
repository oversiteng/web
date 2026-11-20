import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { TaskMilestone } from "@/lib/types/task";
import { getDbReady } from "@/lib/db/client";
import { tasks, taskMilestones, taskChats } from "@/db/schema";
import { eq, asc, and } from "drizzle-orm";

export function extractMilestoneMeta(rawChecklist: unknown): {
  items: string[];
  mediaUrls: string[];
  agentNote?: string;
  pendingApproval?: boolean;
  pdfGenerated?: boolean;
} {
  if (Array.isArray(rawChecklist)) {
    return { items: rawChecklist.map(String), mediaUrls: [] };
  }
  if (rawChecklist && typeof rawChecklist === "object") {
    const obj = rawChecklist as Record<string, any>;
    return {
      items: Array.isArray(obj.items) ? obj.items.map(String) : [],
      mediaUrls: Array.isArray(obj.mediaUrls) ? obj.mediaUrls.map(String) : [],
      agentNote: typeof obj.agentNote === "string" ? obj.agentNote : undefined,
      pendingApproval: Boolean(obj.pendingApproval),
      pdfGenerated: Boolean(obj.pdfGenerated),
    };
  }
  return { items: [], mediaUrls: [] };
}

// GET /api/v1/tasks/:id/milestones — Retrieve task operational milestones with media thumbnails
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const { id: taskId } = await params;
      const db = await getDbReady();

      const existingTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, taskId))
        .limit(1);

      if (existingTasks.length === 0) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Task not found." } },
          { status: 404 }
        );
      }

      const task = existingTasks[0];
      const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
      if (!isAdmin && task.userId !== user.sub && task.agentId !== user.sub) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "You do not have permission to view milestones for this task.",
            },
          },
          { status: 403 }
        );
      }
      const rows = await db
        .select()
        .from(taskMilestones)
        .where(eq(taskMilestones.taskId, taskId))
        .orderBy(asc(taskMilestones.orderIndex), asc(taskMilestones.createdAt));

      const mapped = rows.map((m) => {
        const meta = extractMilestoneMeta(m.checklist);
        return {
          id: m.id,
          taskId: m.taskId,
          title: m.title,
          description: m.description,
          orderIndex: m.orderIndex,
          deliverableType: m.deliverableType,
          checklist: meta.items,
          mediaUrls: meta.mediaUrls,
          agentNote: meta.agentNote,
          pendingApproval: meta.pendingApproval,
          pdfGenerated: meta.pdfGenerated,
          targetDate: m.targetDate ? m.targetDate.toISOString() : null,
          status: m.status as any,
          completionPct: m.completionPct,
          createdAt: m.createdAt.toISOString(),
        };
      });

      return NextResponse.json<ApiResponse<typeof mapped>>({
        success: true,
        data: mapped,
        message: "Milestones retrieved successfully.",
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

// POST /api/v1/tasks/:id/milestones — Add an operational milestone to a task
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, { params }) => {
    try {
      const { id: taskId } = await params;
      const body = await req.json();
      const {
        title,
        description,
        orderIndex = 0,
        deliverableType = "INSPECTION_CHECKLIST",
        checklist = [],
        mediaUrls = [],
        targetDate,
      } = body;

      if (!title || typeof title !== "string" || !title.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message: "Milestone title is required." },
          },
          { status: 400 }
        );
      }

      const db = await getDbReady();

      const existingTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, taskId))
        .limit(1);

      if (existingTasks.length === 0) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Task not found." } },
          { status: 404 }
        );
      }

      const parsedTargetDate = targetDate ? new Date(targetDate) : null;

      const [created] = await db
        .insert(taskMilestones)
        .values({
          taskId,
          title: title.trim(),
          description: description?.trim() || null,
          orderIndex: Number(orderIndex) || 0,
          deliverableType,
          checklist: {
            items: Array.isArray(checklist) ? checklist : [],
            mediaUrls: Array.isArray(mediaUrls) ? mediaUrls : [],
          },
          targetDate:
            parsedTargetDate && !isNaN(parsedTargetDate.getTime()) ? parsedTargetDate : null,
          status: "PENDING",
          completionPct: 0,
        })
        .returning();

      return NextResponse.json<ApiResponse<TaskMilestone>>(
        {
          success: true,
          data: {
            id: created.id,
            taskId: created.taskId,
            title: created.title,
            targetDate: created.targetDate ? created.targetDate.toISOString() : null,
            status: created.status as any,
            completionPct: created.completionPct,
            createdAt: created.createdAt.toISOString(),
          },
          message: "Milestone created successfully.",
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
  }
);

// PATCH /api/v1/tasks/:id/milestones — Submit milestone progress OR field report (routed via Admin first)
export const PATCH = withAuth<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const { id: taskId } = await params;
      const body = await req.json();
      const {
        milestoneId,
        status,
        description,
        note,
        mediaUrls,
        feedbackType = "SUBMISSION", // "REPORT" | "SUBMISSION" | "FINAL_SUBMISSION"
        completionPct,
      } = body;

      if (!milestoneId) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message: "milestoneId is required." },
          },
          { status: 400 }
        );
      }

      const db = await getDbReady();
      const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user.role);

      const [task] = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, taskId))
        .limit(1);

      if (!task) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Task not found." } },
          { status: 404 }
        );
      }

      const [existingMilestone] = await db
        .select()
        .from(taskMilestones)
        .where(and(eq(taskMilestones.id, milestoneId), eq(taskMilestones.taskId, taskId)))
        .limit(1);

      if (!existingMilestone) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Milestone not found." } },
          { status: 404 }
        );
      }

      const prevMeta = extractMilestoneMeta(existingMilestone.checklist);
      const mergedMedia = Array.isArray(mediaUrls)
        ? Array.from(new Set([...prevMeta.mediaUrls, ...mediaUrls]))
        : prevMeta.mediaUrls;

      const feedbackNote = (note || description || "").trim();

      // Rule: When an Agent submits a milestone as COMPLETED, it is intercepted by Admin first!
      // The milestone stays IN_PROGRESS (with pendingApproval: true) until Admin approves it.
      const requestedStatus = status || existingMilestone.status;
      const effectiveStatus =
        !isAdmin && requestedStatus === "COMPLETED" ? "IN_PROGRESS" : requestedStatus;

      const pct =
        typeof completionPct === "number"
          ? completionPct
          : effectiveStatus === "COMPLETED"
            ? 100
            : effectiveStatus === "IN_PROGRESS"
              ? 75
              : 0;

      const nextChecklist = {
        items: prevMeta.items,
        mediaUrls: mergedMedia,
        agentNote: feedbackNote || prevMeta.agentNote,
        pendingApproval: !isAdmin && requestedStatus === "COMPLETED",
        pdfGenerated: prevMeta.pdfGenerated || false,
      };

      const [updated] = await db
        .update(taskMilestones)
        .set({
          status: effectiveStatus as any,
          completionPct: pct,
          ...(feedbackNote ? { description: feedbackNote } : {}),
          checklist: nextChecklist,
          updatedAt: new Date(),
        })
        .where(and(eq(taskMilestones.id, milestoneId), eq(taskMilestones.taskId, taskId)))
        .returning();

      // Emit a reference card into taskChats (routed to Admin as PENDING_REVIEW unless caller is Admin)
      if (updated) {
        const isReport = feedbackType === "REPORT";
        const isFinal = feedbackType === "FINAL_SUBMISSION";
        const cardType = isReport
          ? "FIELD_REPORT"
          : isFinal
            ? "FINAL_SUBMISSION"
            : "MILESTONE_SUBMISSION";

        const statusLabel = isReport
          ? "Agent Field Report"
          : requestedStatus === "COMPLETED"
            ? "Completed"
            : requestedStatus === "IN_PROGRESS"
              ? "In Progress"
              : "Pending";

        const timeString = new Date().toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        });

        const payload = {
          cardType,
          milestoneId: updated.id,
          milestoneTitle: updated.title.replace(/^\d+\.\s*/, ""),
          stageDetails:
            feedbackNote ||
            updated.description ||
            (isReport
              ? "Field agent submitted a situational report / inquiry for this milestone."
              : `Milestone progress submitted with ${mergedMedia.length} media attachment(s).`),
          status: statusLabel,
          requestedStatus,
          mediaUrls: mergedMedia,
          targetLink: `/dashboard/tasks/${taskId}#milestone-${updated.id}`,
          linkLabel: isReport ? "View Milestone & Reply →" : "View Milestone Details →",
          pdfGenerated: false,
          timestamp: timeString,
        };

        try {
          await db.insert(taskChats).values({
            taskId,
            senderId: user.sub,
            receiverId: task.userId,
            message: JSON.stringify(payload),
            rawMessage: `[${cardType}] ${updated.title}: ${payload.stageDetails}`,
            moderatedMessage: isAdmin ? JSON.stringify(payload) : null,
            fileUrl: mergedMedia[0] || null,
            messageType: "MILESTONE_UPDATE",
            isModerated: isAdmin,
            moderationStatus: isAdmin ? "APPROVED_AS_IS" : "PENDING_REVIEW",
            moderatedBy: isAdmin ? user.sub : null,
            moderatedAt: isAdmin ? new Date() : null,
          });
        } catch (chatErr) {
          console.warn("Could not insert milestone chat event:", chatErr);
        }
      }

      return NextResponse.json<
        ApiResponse<
          typeof updated & {
            mediaUrls: string[];
            pendingApproval: boolean;
          }
        >
      >({
        success: true,
        data: {
          ...updated,
          mediaUrls: mergedMedia,
          pendingApproval: nextChecklist.pendingApproval,
        },
        message: isAdmin
          ? "Milestone updated and published to client."
          : feedbackType === "REPORT"
            ? "Field report routed to Admin for review before delivery to client."
            : "Milestone submission routed to Admin for approval.",
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
