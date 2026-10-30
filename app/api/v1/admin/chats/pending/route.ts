import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { PaginatedResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { taskChats, tasks, users } from "@/db/schema";
import { eq, and, asc, count } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

const senderUser = alias(users, "sender_user");
const receiverUser = alias(users, "receiver_user");

export interface PendingChatMessage {
  id: string;
  taskId: string;
  taskTitle: string;
  moduleType: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderRole: string;
  receiverId: string;
  receiverName: string;
  receiverEmail: string;
  receiverRole: string;
  rawMessage: string | null;
  fileUrl: string | null;
  messageType: string;
  moderationStatus: string;
  createdAt: string;
}

// GET /api/v1/admin/chats/pending — Mission Control Queue for Intercepted Messages
export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      const searchParams = req.nextUrl.searchParams;
      const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));
      const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
      const taskId = searchParams.get("taskId");

      const db = await getDbReady();

      const whereClause = taskId
        ? and(eq(taskChats.moderationStatus, "PENDING_REVIEW"), eq(taskChats.taskId, taskId))
        : eq(taskChats.moderationStatus, "PENDING_REVIEW");

      // Count total pending
      const [totalCount] = await db
        .select({ value: count() })
        .from(taskChats)
        .where(whereClause);

      const total = Number(totalCount?.value || 0);

      // Fetch pending messages with sender and receiver details
      const pendingRows = await db
        .select({
          id: taskChats.id,
          taskId: taskChats.taskId,
          taskTitle: tasks.title,
          moduleType: tasks.moduleType,
          senderId: taskChats.senderId,
          senderName: senderUser.name,
          senderEmail: senderUser.email,
          senderRole: senderUser.role,
          receiverId: taskChats.receiverId,
          receiverName: receiverUser.name,
          receiverEmail: receiverUser.email,
          receiverRole: receiverUser.role,
          rawMessage: taskChats.rawMessage,
          message: taskChats.message,
          fileUrl: taskChats.fileUrl,
          messageType: taskChats.messageType,
          moderationStatus: taskChats.moderationStatus,
          createdAt: taskChats.createdAt,
        })
        .from(taskChats)
        .leftJoin(tasks, eq(taskChats.taskId, tasks.id))
        .leftJoin(senderUser, eq(taskChats.senderId, senderUser.id))
        .leftJoin(receiverUser, eq(taskChats.receiverId, receiverUser.id))
        .where(whereClause)
        .orderBy(asc(taskChats.createdAt))
        .limit(limit)
        .offset((page - 1) * limit);

      const data: PendingChatMessage[] = pendingRows.map((row) => ({
        id: row.id,
        taskId: row.taskId,
        taskTitle: row.taskTitle || "Oversite Mission Task",
        moduleType: row.moduleType || "QUICK_ERRANDS",
        senderId: row.senderId,
        senderName: row.senderName || "Unknown Sender",
        senderEmail: row.senderEmail || "",
        senderRole: row.senderRole || "USER",
        receiverId: row.receiverId,
        receiverName: row.receiverName || "Unknown Recipient",
        receiverEmail: row.receiverEmail || "",
        receiverRole: row.receiverRole || "AGENT",
        rawMessage: row.rawMessage || row.message,
        fileUrl: row.fileUrl,
        messageType: row.messageType || "TEXT",
        moderationStatus: row.moderationStatus,
        createdAt: row.createdAt.toISOString(),
      }));

      return NextResponse.json<PaginatedResponse<PendingChatMessage>>({
        success: true,
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
        message: "Pending messages retrieved for Mission Control moderation.",
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
