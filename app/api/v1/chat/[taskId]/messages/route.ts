import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { TaskChat } from "@/lib/types/task";
import { getDb } from "@/lib/db/client";
import { taskChats } from "@/db/schema";
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
      const { receiverId, message, fileUrl } = body;

      if (!message && !fileUrl) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message: "Message or fileUrl is required" },
          },
          { status: 400 }
        );
      }

      const { taskId } = await params;
      const [newMessage] = await db.insert(taskChats).values({
        taskId,
        senderId: user.sub,
        receiverId: receiverId || "00000000-0000-0000-0000-000000000001",
        message,
        fileUrl,
        isModerated: false,
      }).returning();

      const createdChat: TaskChat = {
        ...newMessage,
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
