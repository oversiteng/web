import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { tasks, notifications, users, agentProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAgentTypeLabel } from "@/lib/constants/agentTypes";

// POST /api/v1/tasks/:id/respond — Operative responds to direct dispatch invitation (ACCEPT / REJECT) or applies to open pool task (APPLY)
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const { id: taskId } = await params;
      const body = await req.json();
      const { action, reason } = body; // action: 'ACCEPT' | 'REJECT' | 'APPLY'

      if (!action || !["ACCEPT", "REJECT", "APPLY"].includes(action)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Action must be ACCEPT, REJECT, or APPLY",
            },
          },
          { status: 400 }
        );
      }

      const db = await getDbReady();
      const existingTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, taskId))
        .limit(1);

      if (existingTasks.length === 0) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Task not found." } },
          { status: 404 }
        );
      }

      const task = existingTasks[0];
      const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
      const now = new Date();

      if (action === "APPLY") {
        if (task.agentId && task.agentId !== user.sub) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "ALREADY_ASSIGNED",
                message: "This task has already been assigned to an operative.",
              },
            },
            { status: 409 }
          );
        }

        const [agentUserRows, agentProfRows] = await Promise.all([
          db
            .select({ name: users.name, email: users.email, phone: users.phone })
            .from(users)
            .where(eq(users.id, user.sub))
            .limit(1),
          db
            .select({ tier: agentProfiles.tier, rating: agentProfiles.rating })
            .from(agentProfiles)
            .where(eq(agentProfiles.userId, user.sub))
            .limit(1),
        ]);

        const prevFormData = (task.formData as Record<string, any>) || {};
        const applications: Array<Record<string, any>> = Array.isArray(
          prevFormData.applications
        )
          ? prevFormData.applications.filter((a: any) => a?.agentId !== user.sub)
          : [];

        applications.unshift({
          agentId: user.sub,
          agentName: agentUserRows[0]?.name || agentUserRows[0]?.email || "Operative",
          agentEmail: agentUserRows[0]?.email || "",
          agentTier: agentProfRows[0]?.tier || "GENERAL",
          agentTypeLabel: getAgentTypeLabel(agentProfRows[0]?.tier),
          rating: agentProfRows[0]?.rating || "5.0",
          reason:
            (typeof reason === "string" && reason.trim()) ||
            "Available in corridor and ready for immediate mobilization.",
          appliedAt: now.toISOString(),
        });

        await db
          .update(tasks)
          .set({
            formData: {
              ...prevFormData,
              applications,
            },
            updatedAt: now,
          })
          .where(eq(tasks.id, taskId));

        return NextResponse.json<
          ApiResponse<{ taskId: string; action: string; newStatus: string }>
        >({
          success: true,
          data: {
            taskId: task.id,
            action,
            newStatus: task.status,
          },
          message:
            "Application submitted to Central Operations. You will be notified when assigned.",
        });
      }

      if (!isAdmin && task.agentId !== user.sub) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Only the assigned operative can accept or decline this invitation.",
            },
          },
          { status: 403 }
        );
      }

      if (action === "ACCEPT") {
        const prevFormData = (task.formData as Record<string, any>) || {};
        const [updatedTask] = await db
          .update(tasks)
          .set({
            agentId: user.sub,
            status: "AGENT_EN_ROUTE",
            formData: {
              ...prevFormData,
              acceptedAt: now.toISOString(),
            },
            updatedAt: now,
          })
          .where(eq(tasks.id, taskId))
          .returning();

        await db.insert(notifications).values({
          userId: task.userId,
          type: "TASK_UPDATE",
          title: "Operative Accepted Task",
          body: `An operative has accepted your task "${task.title}" and is mobilizing.`,
          taskId: task.id,
        });

        return NextResponse.json<ApiResponse<{ taskId: string; action: string; newStatus: string }>>({
          success: true,
          data: {
            taskId: updatedTask.id,
            action,
            newStatus: updatedTask.status,
          },
          message: "Task accepted.",
        });
      } else {
        // REJECT action: unassign agent and return to dispatch queue with reason
        const agentUserRows = await db
          .select({ name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, user.sub))
          .limit(1);

        const prevFormData = (task.formData as Record<string, any>) || {};
        const rejections = Array.isArray(prevFormData.rejections) ? prevFormData.rejections : [];
        rejections.unshift({
          agentId: user.sub,
          agentName: agentUserRows[0]?.name || agentUserRows[0]?.email || "Operative",
          reason:
            (typeof reason === "string" && reason.trim()) || "Declined by operative",
          rejectedAt: now.toISOString(),
        });

        const [updatedTask] = await db
          .update(tasks)
          .set({
            agentId: null,
            status: "PENDING",
            formData: {
              ...prevFormData,
              rejections,
            },
            updatedAt: now,
          })
          .where(eq(tasks.id, taskId))
          .returning();

        return NextResponse.json<ApiResponse<{ taskId: string; action: string; newStatus: string }>>({
          success: true,
          data: {
            taskId: updatedTask.id,
            action,
            newStatus: updatedTask.status,
          },
          message: "Task declined. Returned to matching pool.",
        });
      }
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
  { roles: ["AGENT", "ADMIN", "SUPER_ADMIN"] }
);
