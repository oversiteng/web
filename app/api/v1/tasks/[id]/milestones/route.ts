import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { TaskMilestone } from "@/lib/types/task";

export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, { params }) => {
    // TODO: Query db.select().from(taskMilestones).where(eq(taskMilestones.taskId, params.id))
    const mockMilestones: TaskMilestone[] = [
      {
        id: "00000000-0000-0000-0000-000000000031",
        taskId: params.id,
        title: "Foundation & Excavation",
        status: "COMPLETED",
        completionPct: 100,
        createdAt: new Date().toISOString(),
      },
      {
        id: "00000000-0000-0000-0000-000000000032",
        taskId: params.id,
        title: "Ground Floor Decking",
        status: "IN_PROGRESS",
        completionPct: 60,
        createdAt: new Date().toISOString(),
      },
    ];

    return NextResponse.json<ApiResponse<TaskMilestone[]>>({
      success: true,
      data: mockMilestones,
    });
  }
);

export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, { params }) => {
    try {
      const body = await req.json();
      const { title, targetDate } = body;

      if (!title) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message: "Milestone title is required" },
          },
          { status: 400 }
        );
      }

      // TODO: Insert into task_milestones table
      const created: TaskMilestone = {
        id: "00000000-0000-0000-0000-000000000033",
        taskId: params.id,
        title,
        targetDate,
        status: "PENDING",
        completionPct: 0,
        createdAt: new Date().toISOString(),
      };

      return NextResponse.json<ApiResponse<TaskMilestone>>(
        {
          success: true,
          data: created,
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
