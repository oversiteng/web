import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { TaskChat } from "@/lib/types/task";
import { getDbReady } from "@/lib/db/client";
import { taskChats, tasks, properties, users } from "@/db/schema";
import { eq, and, or, inArray, asc } from "drizzle-orm";
import { realtimeBridge } from "@/lib/realtime/websocketHandlers";

// GET /api/v1/chat/:taskId/messages — Role-aware, hub-and-spoke Admin-moderated thread retrieval
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
            error: {
              code: "FORBIDDEN",
              message: "You are not authorized to access this conversation thread.",
            },
          },
          { status: 403 }
        );
      }

      // Clean up any legacy fake seed rows for this task
      try {
        await db
          .delete(taskChats)
          .where(
            and(
              eq(taskChats.taskId, taskId),
              or(
                eq(taskChats.senderId, "agent-tunde-coker"),
                eq(taskChats.receiverId, "agent-tunde-coker")
              )
            )
          );
      } catch {
        // Ignore
      }

      const isPropertyOversite = task.moduleType === "PROPERTY_OVERSITE";

      // If no agent has accepted/been assigned yet (and not a Property Oversight desk thread), conversation does not exist yet
      if (!task.agentId && !isPropertyOversite && !isAdmin) {
        return NextResponse.json<ApiResponse<TaskChat[]>>({
          success: true,
          data: [],
          message: "Conversation will open once an accredited agent accepts this task.",
        });
      }

      // 2. Query messages with strict Hub-and-Spoke Admin Moderation visibility
      let messages;
      if (isAdmin) {
        messages = await db
          .select()
          .from(taskChats)
          .where(eq(taskChats.taskId, taskId))
          .orderBy(asc(taskChats.createdAt));
      } else {
        // Non-admin participants see:
        // a) Messages they sent themselves (including PENDING_REVIEW and REJECTED so they see status/warnings)
        // b) Approved/Refined messages in this task thread addressed to them OR broadcast to the thread
        messages = await db
          .select()
          .from(taskChats)
          .where(
            and(
              eq(taskChats.taskId, taskId),
              or(
                eq(taskChats.senderId, user.sub),
                and(
                  inArray(taskChats.moderationStatus, ["APPROVED_AS_IS", "REFINED_BY_ADMIN"]),
                  or(
                    eq(taskChats.receiverId, user.sub),
                    // Ensure approved messages between owner & agent always deliver even if agent was assigned later
                    isAssignedAgent ? eq(taskChats.senderId, task.userId) : undefined,
                    isOwner && task.agentId ? eq(taskChats.senderId, task.agentId) : undefined,
                    inArray(taskChats.messageType, ["MILESTONE_UPDATE", "SYSTEM"])
                  )
                )
              )
            )
          )
          .orderBy(asc(taskChats.createdAt));
      }

      // 3. Format curated message text
      const mappedMessages: TaskChat[] = messages.map((m: any) => {
        // If Admin modified the message, show the refined message to both recipient and sender
        const displayMessage =
          m.moderationStatus === "REFINED_BY_ADMIN" && m.moderatedMessage
            ? m.moderatedMessage
            : m.moderatedMessage || m.message || m.rawMessage;

        return {
          id: m.id,
          taskId: m.taskId,
          senderId: m.senderId,
          receiverId: m.receiverId,
          message: displayMessage,
          rawMessage: isAdmin || m.senderId === user.sub ? m.rawMessage || m.message : undefined,
          moderatedMessage: m.moderatedMessage || undefined,
          fileUrl: m.fileUrl,
          messageType: m.messageType || "TEXT",
          isModerated: m.isModerated,
          moderationStatus: m.moderationStatus as any,
          moderatedBy: m.moderatedBy || undefined,
          moderatedAt: m.moderatedAt ? m.moderatedAt.toISOString() : undefined,
          rejectionReason:
            isAdmin || m.senderId === user.sub ? m.rejectionReason || undefined : undefined,
          createdAt:
            m.createdAt instanceof Date ? m.createdAt.toISOString() : String(m.createdAt),
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

// POST /api/v1/chat/:taskId/messages — Route message to Admin Moderation Queue
export const POST = withAuth<{ taskId: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const body = await req.json();
      const textMessage = body.content || body.message || body.rawMessage;
      const fileUrl =
        body.fileUrl ||
        (body.messageType !== "TEXT" &&
        typeof textMessage === "string" &&
        textMessage.startsWith("http")
          ? textMessage
          : undefined);
      let receiverId = body.receiverId;
      const requestedMessageType = body.messageType || (fileUrl ? "ATTACHMENT" : "TEXT");

      if (!textMessage && !fileUrl) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Message content or fileUrl is required",
            },
          },
          { status: 400 }
        );
      }

      const { taskId } = await params;
      const db = await getDbReady();

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
            error: {
              code: "FORBIDDEN",
              message: "You are not authorized to post messages in this task.",
            },
          },
          { status: 403 }
        );
      }

      const isPropertyOversite = task.moduleType === "PROPERTY_OVERSITE";

      // Conversations do not start until an agent has accepted/been assigned to the task (except Property Oversight tasks, which chat directly with Oversite)
      if (!task.agentId && !isPropertyOversite && !isAdmin) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "AGENT_NOT_ASSIGNED",
              message:
                "Conversation cannot be started until an accredited field agent accepts this task.",
            },
          },
          { status: 400 }
        );
      }

      // Auto-resolve receiverId to a valid UUID if not explicitly provided
      const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!receiverId || !UUID_PATTERN.test(String(receiverId))) {
        if (isOwner) {
          if (task.agentId && UUID_PATTERN.test(task.agentId)) {
            receiverId = task.agentId;
          } else {
            let assignedManagerUuid: string | null = null;
            if (task.propertyId) {
              const [propRow] = await db
                .select({ description: properties.description })
                .from(properties)
                .where(eq(properties.id, task.propertyId))
                .limit(1);
              if (propRow?.description && propRow.description.trim().startsWith("{")) {
                try {
                  const parsed = JSON.parse(propRow.description);
                  if (
                    parsed?.assignedAgentId &&
                    UUID_PATTERN.test(String(parsed.assignedAgentId))
                  ) {
                    assignedManagerUuid = String(parsed.assignedAgentId);
                  }
                } catch {}
              }
            }
            if (assignedManagerUuid) {
              receiverId = assignedManagerUuid;
            } else {
              const adminRows = await db
                .select({ id: users.id })
                .from(users)
                .where(inArray(users.role, ["ADMIN", "SUPER_ADMIN"]))
                .limit(1);
              receiverId = adminRows[0]?.id || task.userId;
            }
          }
        } else if (isAssignedAgent) {
          receiverId = task.userId;
        } else {
          receiverId = task.userId;
        }
      }

      // Hub-and-Spoke Rule:
      // All user & agent messages and milestone submissions are routed to Admin (PENDING_REVIEW) first.
      // Only Admin actions are immediately APPROVED_AS_IS.
      const isAutoApproved = isAdmin;
      const moderationStatus = isAutoApproved ? "APPROVED_AS_IS" : "PENDING_REVIEW";
      const isModerated = isAutoApproved;

      const [newMessage] = await db
        .insert(taskChats)
        .values({
          taskId,
          senderId: user.sub,
          receiverId,
          message: textMessage || null,
          rawMessage: textMessage || null,
          moderatedMessage: isAutoApproved ? textMessage || null : null,
          fileUrl: fileUrl || null,
          messageType: requestedMessageType,
          isModerated,
          moderationStatus,
          moderatedBy: isAutoApproved ? user.sub : null,
          moderatedAt: isAutoApproved ? new Date() : null,
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
        deliveryStatus: isAutoApproved
          ? "Delivered"
          : "Routed to Oversite Admin for review",
      };

      // Hub-and-Spoke Strict Moderation Rule:
      // NEVER broadcast PENDING_REVIEW messages to the live recipient thread (`task:chat:${taskId}`).
      // Only publish to `task:chat:${taskId}` when Admin sends directly (isAutoApproved).
      if (isAutoApproved) {
        realtimeBridge
          .publish({
            channel: `task:chat:${taskId}`,
            event: "message",
            payload: createdChat,
          })
          .catch((err) => console.error("[Chat Stream] Publish error:", err));
      } else {
        realtimeBridge
          .publish({
            channel: `admin:chat:moderation`,
            event: "pending_message",
            payload: createdChat,
          })
          .catch((err) => console.error("[Admin Moderation Stream] Publish error:", err));
      }

      return NextResponse.json<ApiResponse<TaskChat & { deliveryStatus: string }>>(
        {
          success: true,
          data: createdChat,
          message: isAutoApproved
            ? "Message delivered."
            : "Message routed to Oversite Admin for review before delivery.",
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
