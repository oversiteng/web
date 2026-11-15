import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { TaskChat } from "@/lib/types/task";
import { getDbReady } from "@/lib/db/client";
import { taskChats, taskMilestones, taskReports, tasks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { extractMilestoneMeta } from "@/app/api/v1/tasks/[id]/milestones/route";

// POST /api/v1/admin/chats/:messageId/moderate — Curate, Approve, Modify, or Reject intercepted message / milestone / report
export const POST = withAuth<{ messageId: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const { messageId } = await params;
      const body = await req.json();
      const { action, refinedMessage, rejectionReason, generatePdf } = body;

      if (!action || !["APPROVE", "REFINE", "REJECT"].includes(action)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "action is required and must be one of: 'APPROVE', 'REFINE', 'REJECT'.",
            },
          },
          { status: 400 }
        );
      }

      if (
        action === "REFINE" &&
        (!refinedMessage || typeof refinedMessage !== "string" || !refinedMessage.trim())
      ) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "refinedMessage is required when action is 'REFINE'.",
            },
          },
          { status: 400 }
        );
      }

      const db = await getDbReady();

      const existingMessages = await db
        .select()
        .from(taskChats)
        .where(eq(taskChats.id, messageId))
        .limit(1);

      if (existingMessages.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "NOT_FOUND", message: "Chat message not found." },
          },
          { status: 404 }
        );
      }

      const target = existingMessages[0];
      const now = new Date();

      // Check if this intercepted message is a structured MILESTONE_UPDATE / REPORT card
      let parsedCard: Record<string, any> | null = null;
      if (target.messageType === "MILESTONE_UPDATE" && target.message) {
        try {
          parsedCard = JSON.parse(target.message);
        } catch {
          parsedCard = null;
        }
      }

      let updatedStatus: "APPROVED_AS_IS" | "REFINED_BY_ADMIN" | "REJECTED";
      let finalModeratedMessage: string | null = target.moderatedMessage;
      let finalDisplayMessage: string | null = target.message;
      let finalRejectionReason: string | null = null;

      if (action === "APPROVE" || action === "REFINE") {
        updatedStatus = action === "APPROVE" ? "APPROVED_AS_IS" : "REFINED_BY_ADMIN";

        if (parsedCard) {
          if (action === "REFINE" && refinedMessage?.trim()) {
            parsedCard.stageDetails = refinedMessage.trim();
          }
          if (generatePdf) {
            parsedCard.pdfGenerated = true;
            parsedCard.pdfUrl = `/dashboard/tasks/${target.taskId}/report`;
          }
          const serialized = JSON.stringify(parsedCard);
          finalModeratedMessage = serialized;
          finalDisplayMessage = serialized;
        } else {
          const cleanText =
            action === "REFINE"
              ? refinedMessage.trim()
              : target.rawMessage || target.message;
          finalModeratedMessage = cleanText;
          finalDisplayMessage = cleanText;
        }

        // If this card references a milestone submission, promote the milestone to COMPLETED
        if (parsedCard?.milestoneId) {
          const [ms] = await db
            .select()
            .from(taskMilestones)
            .where(
              and(
                eq(taskMilestones.id, parsedCard.milestoneId),
                eq(taskMilestones.taskId, target.taskId)
              )
            )
            .limit(1);

          if (ms) {
            const meta = extractMilestoneMeta(ms.checklist);
            const isCompletionSubmission =
              parsedCard.cardType === "MILESTONE_SUBMISSION" ||
              parsedCard.cardType === "FINAL_SUBMISSION" ||
              parsedCard.requestedStatus === "COMPLETED" ||
              parsedCard.status === "Completed";

            await db
              .update(taskMilestones)
              .set({
                status: isCompletionSubmission ? "COMPLETED" : ms.status,
                completionPct: isCompletionSubmission ? 100 : ms.completionPct,
                description: parsedCard.stageDetails || ms.description,
                checklist: {
                  ...meta,
                  mediaUrls: Array.isArray(parsedCard.mediaUrls)
                    ? parsedCard.mediaUrls
                    : meta.mediaUrls,
                  agentNote: parsedCard.stageDetails || meta.agentNote,
                  pendingApproval: false,
                  pdfGenerated: Boolean(generatePdf) || meta.pdfGenerated,
                },
                updatedAt: now,
              })
              .where(eq(taskMilestones.id, ms.id));
          }
        }

        // If Admin opted to generate & send the PDF report to the end user
        if (generatePdf || parsedCard?.cardType === "FINAL_SUBMISSION") {
          const existingReports = await db
            .select()
            .from(taskReports)
            .where(eq(taskReports.taskId, target.taskId))
            .limit(1);

          if (existingReports.length > 0) {
            await db
              .update(taskReports)
              .set({
                status: "APPROVED",
                summary:
                  parsedCard?.stageDetails ||
                  existingReports[0].summary ||
                  "Official verification report compiled and approved by Oversite Admin.",
                pdfS3Key: `/dashboard/tasks/${target.taskId}/report`,
                compiledBy: user.sub,
                compiledAt: now,
                updatedAt: now,
              })
              .where(eq(taskReports.id, existingReports[0].id));
          } else {
            await db.insert(taskReports).values({
              taskId: target.taskId,
              agentId: target.senderId,
              summary:
                parsedCard?.stageDetails ||
                finalDisplayMessage ||
                "Official verification report compiled and approved by Oversite Admin.",
              findings: parsedCard?.stageDetails || finalDisplayMessage || null,
              status: "APPROVED",
              completionPct: 100,
              pdfS3Key: `/dashboard/tasks/${target.taskId}/report`,
              compiledBy: user.sub,
              compiledAt: now,
            });
          }

          if (parsedCard?.cardType === "FINAL_SUBMISSION") {
            await db
              .update(tasks)
              .set({ status: "REPORT_SUBMITTED", updatedAt: now })
              .where(eq(tasks.id, target.taskId));
          }
        }
      } else {
        // REJECT
        updatedStatus = "REJECTED";
        finalRejectionReason =
          rejectionReason?.trim() ||
          "Submission / message rejected by Admin. Please review warning and resubmit.";

        if (parsedCard?.milestoneId) {
          const [ms] = await db
            .select()
            .from(taskMilestones)
            .where(eq(taskMilestones.id, parsedCard.milestoneId))
            .limit(1);
          if (ms) {
            const meta = extractMilestoneMeta(ms.checklist);
            await db
              .update(taskMilestones)
              .set({
                checklist: { ...meta, pendingApproval: false },
                updatedAt: now,
              })
              .where(eq(taskMilestones.id, ms.id));
          }
        }
      }

      const [updatedMessage] = await db
        .update(taskChats)
        .set({
          moderationStatus: updatedStatus,
          isModerated: true,
          moderatedMessage: finalModeratedMessage,
          message: finalDisplayMessage,
          moderatedBy: user.sub,
          moderatedAt: now,
          rejectionReason: finalRejectionReason,
        })
        .where(eq(taskChats.id, messageId))
        .returning();

      const result: TaskChat = {
        id: updatedMessage.id,
        taskId: updatedMessage.taskId,
        senderId: updatedMessage.senderId,
        receiverId: updatedMessage.receiverId,
        message: updatedMessage.message,
        rawMessage: updatedMessage.rawMessage || undefined,
        moderatedMessage: updatedMessage.moderatedMessage || undefined,
        fileUrl: updatedMessage.fileUrl,
        messageType: updatedMessage.messageType || "TEXT",
        isModerated: updatedMessage.isModerated,
        moderationStatus: updatedMessage.moderationStatus as any,
        moderatedBy: updatedMessage.moderatedBy || undefined,
        moderatedAt: updatedMessage.moderatedAt ? updatedMessage.moderatedAt.toISOString() : undefined,
        rejectionReason: updatedMessage.rejectionReason || undefined,
        createdAt: updatedMessage.createdAt.toISOString(),
      };

      return NextResponse.json<ApiResponse<TaskChat>>({
        success: true,
        data: result,
        message:
          action === "APPROVE"
            ? generatePdf
              ? "Approved, PDF generated, and delivered to end user."
              : "Approved and released to recipient."
            : action === "REFINE"
              ? "Modified by Admin and dispatched to recipient."
              : "Rejected with warning sent to sender.",
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
  },
  { roles: ["ADMIN", "SUPER_ADMIN"] }
);
