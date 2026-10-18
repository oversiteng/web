import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { TaskChat } from "@/lib/types/task";
import { getDb } from "@/lib/db/client";
import { taskChats, tasks } from "@/db/schema";
import { eq } from "drizzle-orm";

const db = getDb();

export const GET = withAuth<{ taskId: string }>(
  async (req: NextRequest, { params }) => {
    const { taskId } = await params;
    const messages = await db.select().from(taskChats).where(eq(taskChats.taskId, taskId));
    
    const mappedMessages: TaskChat[] = messages.map(m => ({
      ...m,
      createdAt: m.createdAt.toISOString()
    }));

    return NextResponse.json<ApiResponse<TaskChat[]>>({
      success: true,
      data: mappedMessages,
    });
  }
);

export const POST = withAuth<{ taskId: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const body = await req.json();
      const textMessage = body.content || body.message;
      const fileUrl = body.fileUrl || (body.messageType !== "TEXT" && body.content?.startsWith("http") ? body.content : undefined);
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

      // Auto-resolve receiverId if not provided:
      // If sender is task owner, send to assigned agent; if sender is agent, send to task owner
      if (!receiverId) {
        const existingTasks = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
        if (existingTasks.length > 0) {
          const t = existingTasks[0];
          receiverId = user.sub === t.userId ? t.agentId : t.userId;
        }
      }

      const [newMessage] = await db.insert(taskChats).values({
        taskId,
        senderId: user.sub,
        receiverId: receiverId || user.sub,
        message: textMessage || null,
        fileUrl: fileUrl || null,
        isModerated: false,
      }).returning();

      const createdChat: TaskChat & { content?: string } = {
        ...newMessage,
        content: newMessage.message || undefined,
        createdAt: newMessage.createdAt.toISOString(),
      };

      return NextResponse.json<ApiResponse<TaskChat>>(
        {
          success: true,
          data: createdChat,
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
