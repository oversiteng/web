import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { tasks, taskChats, users } from "@/db/schema";
import { eq, or, desc, and, inArray, isNotNull } from "drizzle-orm";

export interface ChatThread {
  taskId: string;
  taskTitle: string;
  taskStatus: string;
  moduleType: string;
  agentId: string | null;
  agentName: string;
  agentBadge: string;
  lastMessage: string;
  lastMessageStatus?: string;
  lastMessageAt: string;
  unreadCount: number;
}

export const GET = withAuth(async (req: NextRequest, { user }) => {
  try {
    const db = await getDbReady();
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user.role);

    // Purge any legacy fake seed rows ("agent-tunde-coker") so unassigned tasks never show fake chats
    try {
      await db
        .delete(taskChats)
        .where(
          or(
            eq(taskChats.senderId, "agent-tunde-coker"),
            eq(taskChats.receiverId, "agent-tunde-coker")
          )
        );
    } catch {
      // Ignore if none exist
    }

    // Regular tasks open conversation after an agent accepts/is assigned (tasks.agentId IS NOT NULL).
    // Property Oversight tasks (moduleType = 'PROPERTY_OVERSITE') open immediately so the user chats directly with Oversite.
    const userTasks = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        status: tasks.status,
        moduleType: tasks.moduleType,
        userId: tasks.userId,
        agentId: tasks.agentId,
        agentName: users.name,
        updatedAt: tasks.updatedAt,
        createdAt: tasks.createdAt,
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.agentId, users.id))
      .where(
        isAdmin
          ? or(isNotNull(tasks.agentId), eq(tasks.moduleType, "PROPERTY_OVERSITE"))
          : and(
              or(isNotNull(tasks.agentId), eq(tasks.moduleType, "PROPERTY_OVERSITE")),
              or(eq(tasks.userId, user.sub), eq(tasks.agentId, user.sub))
            )
      )
      .orderBy(desc(tasks.updatedAt));

    const threads: ChatThread[] = [];

    for (const task of userTasks) {
      const isPropertyOversite = task.moduleType === "PROPERTY_OVERSITE";
      if (!task.agentId && !isPropertyOversite) continue;

      const messages = await db
        .select()
        .from(taskChats)
        .where(
          and(
            eq(taskChats.taskId, task.id),
            isAdmin
              ? undefined
              : or(
                  // Messages sent by this user (any moderation status so they see their own pending/rejected status)
                  eq(taskChats.senderId, user.sub),
                  // Messages sent TO this user that have been approved or refined by Admin
                  and(
                    eq(taskChats.receiverId, user.sub),
                    inArray(taskChats.moderationStatus, ["APPROVED_AS_IS", "REFINED_BY_ADMIN"])
                  ),
                  // Milestone updates
                  inArray(taskChats.messageType, ["MILESTONE_UPDATE", "SYSTEM"])
                )
          )
        )
        .orderBy(desc(taskChats.createdAt))
        .limit(1);

      const agentName = isPropertyOversite
        ? user.role === "AGENT"
          ? "Oversite Operations"
          : "Oversite"
        : task.agentName || "Assigned Field Agent";
      const agentBadge = isPropertyOversite
        ? "PROPERTY-DESK"
        : `OS-${(task.agentId || "0000").slice(0, 4).toUpperCase()}`;

      if (messages.length > 0) {
        const lastMsg = messages[0];
        let display = "";

        if (lastMsg.messageType === "MILESTONE_UPDATE") {
          try {
            const parsed = JSON.parse(lastMsg.message || "{}");
            display = `Milestone: ${parsed.milestoneTitle || "Stage updated"}`;
          } catch {
            display = "Milestone update";
          }
        } else if (lastMsg.senderId === user.sub) {
          const text = lastMsg.moderatedMessage || lastMsg.message || lastMsg.rawMessage || "";
          if (lastMsg.moderationStatus === "PENDING_REVIEW") {
            display = `You (Pending Admin Review): ${text}`;
          } else if (lastMsg.moderationStatus === "REJECTED") {
            display = `⚠️ Rejected by Admin: ${text}`;
          } else {
            display = `You: ${text}`;
          }
        } else {
          display =
            lastMsg.moderatedMessage ||
            lastMsg.message ||
            (lastMsg.fileUrl ? "[Attachment]" : "New message");
        }

        threads.push({
          taskId: task.id,
          taskTitle: task.title,
          taskStatus: task.status,
          moduleType: task.moduleType,
          agentId: task.agentId,
          agentName,
          agentBadge,
          lastMessage: display,
          lastMessageStatus: lastMsg.moderationStatus,
          lastMessageAt: lastMsg.createdAt.toISOString(),
          unreadCount: 0,
        });
      } else {
        // Agent has accepted the task, so the task channel is genuinely open
        threads.push({
          taskId: task.id,
          taskTitle: task.title,
          taskStatus: task.status,
          moduleType: task.moduleType,
          agentId: task.agentId,
          agentName,
          agentBadge,
          lastMessage: `${agentName} accepted task · Tap to message via Admin`,
          lastMessageAt: (task.updatedAt || task.createdAt).toISOString(),
          unreadCount: 0,
        });
      }
    }

    return NextResponse.json<ApiResponse<ChatThread[]>>({
      success: true,
      data: threads,
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
});
