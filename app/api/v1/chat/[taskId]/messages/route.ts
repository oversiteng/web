import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { TaskChat } from "@/lib/types/task";
import { getDbReady } from "@/lib/db/client";
import { taskChats, tasks } from "@/db/schema";
import { eq, and, or, inArray, desc, asc } from "drizzle-orm";

// GET /api/v1/chat/:taskId/messages — Role-aware, hub-and-spoke filtered thread retrieval
export const GET = withAuth<{ taskId: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const { taskId } = await params;
      const db = await getDbReady();

      // 1. Authorize: verify task exists and caller is task owner, assigned agent, or admin
      const existingTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, taskId))
        .limit(1);

      if (existingTasks.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "NOT_FOUND", message: "Task not found." },
          },
          { status: 404 }
        );
      }

      const task = existingTasks[0];
      const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user.role);
      const isOwner = task.userId === user.sub;
      const isAssignedAgent = task.agentId === user.sub;

      if (!isAdmin && !isOwner && !isAssignedAgent) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "FORBIDDEN", message: "You are not authorized to access this conversation thread." },
          },
          { status: 403 }
        );
      }

      // 2. Query messages
      let messages;
      if (isAdmin) {
        // Admin / Mission Control sees all messages, including pending review & rejected
        messages = await db
          .select()
          .from(taskChats)
          .where(eq(taskChats.taskId, taskId))
          .orderBy(asc(taskChats.createdAt));
      } else {
        // Hub-and-spoke moderation filter for User and Agent:
        // Sender sees their own messages (even if PENDING_REVIEW);
        // Recipient ONLY sees messages that have been approved or refined by Mission Control.
        messages = await db
          .select()
          .from(taskChats)
          .where(
            and(
              eq(taskChats.taskId, taskId),
              or(
                // Sent by caller
                eq(taskChats.senderId, user.sub),
                // Received by caller AND approved/refined
                and(
                  eq(taskChats.receiverId, user.sub),
                  inArray(taskChats.moderationStatus, ["APPROVED_AS_IS", "REFINED_BY_ADMIN"])
                )
              )
            )
          )
          .orderBy(asc(taskChats.createdAt));
      }

      // 3. Format curated message text
      const mappedMessages: TaskChat[] = messages.map((m) => {
        // For recipient, display moderatedMessage if curated; otherwise fallback to raw text
        const displayMessage =
          m.receiverId === user.sub && m.moderatedMessage
            ? m.moderatedMessage
            : m.moderatedMessage || m.message || m.rawMessage;

        return {
          id: m.id,
          taskId: m.taskId,
          senderId: m.senderId,
          receiverId: m.receiverId,
          message: displayMessage,
          rawMessage: isAdmin ? m.rawMessage || m.message : undefined,
          moderatedMessage: m.moderatedMessage || undefined,
          fileUrl: m.fileUrl,
          messageType: m.messageType || "TEXT",
          isModerated: m.isModerated,
          moderationStatus: m.moderationStatus as any,
          moderatedBy: m.moderatedBy || undefined,
          moderatedAt: m.moderatedAt ? m.moderatedAt.toISOString() : undefined,
          rejectionReason: isAdmin || m.senderId === user.sub ? m.rejectionReason || undefined : undefined,
          createdAt: m.createdAt.toISOString(),
        };
      });

      return NextResponse.json<ApiResponse<TaskChat[]>>({
        success: true,
        data: mappedMessages,
        message: "Chat messages retrieved successfully.",
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

// POST /api/v1/chat/:taskId/messages — Send message into Mission Control moderation queue
export const POST = withAuth<{ taskId: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const body = await req.json();
      const textMessage = body.content || body.message || body.rawMessage;
      const fileUrl =
        body.fileUrl ||
        (body.messageType !== "TEXT" && typeof textMessage === "string" && textMessage.startsWith("http")
          ? textMessage
          : undefined);
      let receiverId = body.receiverId;

      if (!textMessage && !fileUrl) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message: "Message content or fileUrl is required" },
          },
          { status: 400 }
        );
      }

      const { taskId } = await params;
      const db = await getDbReady();

      // Verify task exists
      const existingTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, taskId))
        .limit(1);

      if (existingTasks.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "NOT_FOUND", message: "Task not found." },
          },
          { status: 404 }
        );
      }

      const task = existingTasks[0];
      const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user.role);
      const isOwner = task.userId === user.sub;
      const isAssignedAgent = task.agentId === user.sub;

      if (!isAdmin && !isOwner && !isAssignedAgent) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "FORBIDDEN", message: "You are not authorized to post messages in this task." },
          },
          { status: 403 }
        );
      }

      // Auto-resolve receiverId if not explicitly provided
      if (!receiverId) {
        if (isOwner) {
          receiverId = task.agentId || task.userId;
        } else if (isAssignedAgent) {
          receiverId = task.userId;
        } else {
          receiverId = task.userId;
        }
      }

      // Determine initial moderation state
      // Admin messages are pre-approved; User & Agent messages are intercepted for Mission Control review
      const moderationStatus = isAdmin ? "APPROVED_AS_IS" : "PENDING_REVIEW";
      const isModerated = isAdmin;
      const messageType = fileUrl ? "ATTACHMENT" : "TEXT";

      const [newMessage] = await db
        .insert(taskChats)
        .values({
          taskId,
          senderId: user.sub,
          receiverId,
          message: textMessage || null,
          rawMessage: textMessage || null,
          moderatedMessage: isAdmin ? textMessage || null : null,
          fileUrl: fileUrl || null,
          messageType,
          isModerated,
          moderationStatus,
          moderatedBy: isAdmin ? user.sub : null,
          moderatedAt: isAdmin ? new Date() : null,
        })
        .returning();

      const createdChat: TaskChat & { deliveryStatus: string } = {
        id: newMessage.id,
        taskId: newMessage.taskId,
        senderId: newMessage.senderId,
        receiverId: newMessage.receiverId,
        message: newMessage.message,
        rawMessage: newMessage.rawMessage,
        moderatedMessage: newMessage.moderatedMessage || undefined,
        fileUrl: newMessage.fileUrl,
        messageType: newMessage.messageType || "TEXT",
        isModerated: newMessage.isModerated,
        moderationStatus: newMessage.moderationStatus as any,
        moderatedBy: newMessage.moderatedBy || undefined,
        moderatedAt: newMessage.moderatedAt ? newMessage.moderatedAt.toISOString() : undefined,
        createdAt: newMessage.createdAt.toISOString(),
        deliveryStatus: "Secured", // Institutional reassurance indicator for UI
      };

      return NextResponse.json<ApiResponse<TaskChat & { deliveryStatus: string }>>(
        {
          success: true,
          data: createdChat,
          message: isAdmin
            ? "Message posted directly by Central Operations."
            : "Message received and secured in Mission Control queue for review.",
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
