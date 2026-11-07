import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { tasks, taskChats } from "@/db/schema";
import { eq, or, desc, and, inArray } from "drizzle-orm";

export interface ChatThread {
  taskId: string;
  taskTitle: string;
  moduleType: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export const GET = withAuth(async (req: NextRequest, { user }) => {
  try {
    const db = await getDbReady();
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user.role);

    // 1. Fetch tasks where user is either client or assigned agent (or all tasks for admin)
    const userTasks = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        moduleType: tasks.moduleType,
        updatedAt: tasks.updatedAt,
        createdAt: tasks.createdAt,
      })
      .from(tasks)
      .where(isAdmin ? undefined : or(eq(tasks.userId, user.sub), eq(tasks.agentId, user.sub)))
      .orderBy(desc(tasks.updatedAt));

    const threads: ChatThread[] = [];

    // 2. Fetch last message for each task respecting role visibility
    for (const task of userTasks) {
      const messages = await db
        .select()
        .from(taskChats)
        .where(
          and(
            eq(taskChats.taskId, task.id),
            isAdmin
              ? undefined
              : or(
                  eq(taskChats.senderId, user.sub),
                  and(
                    eq(taskChats.receiverId, user.sub),
                    inArray(taskChats.moderationStatus, ["APPROVED_AS_IS", "REFINED_BY_ADMIN"])
                  )
                )
          )
        )
        .orderBy(desc(taskChats.createdAt))
        .limit(1);

      if (messages.length > 0) {
        const lastMsg = messages[0];
        const display =
          lastMsg.receiverId === user.sub && lastMsg.moderatedMessage
            ? lastMsg.moderatedMessage
            : lastMsg.moderatedMessage || lastMsg.message || (lastMsg.fileUrl ? "[Attachment]" : "Active task thread");

        threads.push({
          taskId: task.id,
          taskTitle: task.title,
          moduleType: task.moduleType,
          lastMessage: display,
          lastMessageAt: lastMsg.createdAt.toISOString(),
          unreadCount: 0,
        });
      } else {
        threads.push({
          taskId: task.id,
          taskTitle: task.title,
          moduleType: task.moduleType,
          lastMessage: "Conversation created.",
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
