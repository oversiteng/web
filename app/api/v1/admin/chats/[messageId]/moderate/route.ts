import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { TaskChat } from "@/lib/types/task";
import { getDbReady } from "@/lib/db/client";
import { taskChats } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/v1/admin/chats/:messageId/moderate — Curate, Approve, or Reject intercepted message
export const POST = withAuth<{ messageId: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const { messageId } = await params;
      const body = await req.json();
      const { action, refinedMessage, rejectionReason } = body;

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

      if (action === "REFINE" && (!refinedMessage || typeof refinedMessage !== "string" || !refinedMessage.trim())) {
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

      let updatedStatus: "APPROVED_AS_IS" | "REFINED_BY_ADMIN" | "REJECTED";
      let finalModeratedMessage: string | null = target.moderatedMessage;
      let finalDisplayMessage: string | null = target.message;
      let finalRejectionReason: string | null = null;

      if (action === "APPROVE") {
        updatedStatus = "APPROVED_AS_IS";
        finalModeratedMessage = target.rawMessage || target.message;
        finalDisplayMessage = target.rawMessage || target.message;
      } else if (action === "REFINE") {
        updatedStatus = "REFINED_BY_ADMIN";
        finalModeratedMessage = refinedMessage.trim();
        finalDisplayMessage = refinedMessage.trim();
      } else {
        // REJECT
        updatedStatus = "REJECTED";
        finalRejectionReason =
          rejectionReason?.trim() || "Message violates platform safety and off-platform communication policies.";
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
            ? "Message approved and released to recipient."
            : action === "REFINE"
            ? "Message refined by Central Operations and dispatched to recipient."
            : "Message rejected. It will not be delivered to the recipient.",
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
