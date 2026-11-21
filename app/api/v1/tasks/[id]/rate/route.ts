import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { tasks, agentProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/v1/tasks/:id/rate — Client rates completed task & operative
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const { id: taskId } = await params;
      const body = await req.json().catch(() => ({}));
      const rating = Number(body.rating);
      const feedback = typeof body.feedback === "string" ? body.feedback.trim() : "";

      if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Rating must be a number between 1 and 5.",
            },
          },
          { status: 400 }
        );
      }

      const db = await getDbReady();
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

      const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
      if (!isAdmin && task.userId !== user.sub) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Only the task owner can rate this task.",
            },
          },
          { status: 403 }
        );
      }

      const prevFormData = (task.formData as Record<string, any>) || {};
      if (prevFormData.clientRating && !isAdmin) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "ALREADY_RATED",
              message: "You have already submitted a rating for this task.",
            },
          },
          { status: 409 }
        );
      }

      const completionTimestamp = task.completedAt
        ? new Date(task.completedAt).getTime()
        : task.updatedAt
        ? new Date(task.updatedAt).getTime()
        : new Date(task.createdAt).getTime();
      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

      if (
        task.status === "COMPLETED" &&
        Date.now() - completionTimestamp > SEVEN_DAYS_MS &&
        !isAdmin
      ) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "RATING_WINDOW_EXPIRED",
              message:
                "The 7-day rating window after task completion has closed. This task has been auto-finalized.",
            },
          },
          { status: 400 }
        );
      }

      const commentText =
        typeof body.comment === "string" && body.comment.trim()
          ? body.comment.trim()
          : feedback;
      const nowIso = new Date().toISOString();

      await db
        .update(tasks)
        .set({
          formData: {
            ...prevFormData,
            clientRating: {
              rating,
              feedback: commentText,
              comment: commentText,
              ratedBy: user.sub,
              ratedAt: nowIso,
            },
          },
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, taskId));

      // Update agent profile rolling average rating if an agent was assigned
      if (task.agentId) {
        const [profile] = await db
          .select()
          .from(agentProfiles)
          .where(eq(agentProfiles.userId, task.agentId))
          .limit(1);

        if (profile) {
          const prevCount = Math.max(0, Number(profile.totalTasks || 0));
          const prevRating = Number(profile.rating || 0);
          const nextRating =
            prevCount > 0 && prevRating > 0
              ? ((prevRating * prevCount + rating) / (prevCount + 1)).toFixed(2)
              : rating.toFixed(2);

          await db
            .update(agentProfiles)
            .set({
              rating: nextRating,
              updatedAt: new Date(),
            })
            .where(eq(agentProfiles.id, profile.id));
        }
      }

      return NextResponse.json<ApiResponse<{ taskId: string; rating: number; feedback: string }>>({
        success: true,
        data: { taskId, rating, feedback },
        message: "Thank you for rating this task.",
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

