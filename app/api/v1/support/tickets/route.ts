import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse, PaginatedResponse } from "@/lib/types/api";

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  category: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "NORMAL" | "HIGH";
  createdAt: string;
  updatedAt: string;
}

// In-memory support store
const supportTicketsStore: SupportTicket[] = [
  {
    id: "tkt-001",
    userId: "00000000-0000-0000-0000-000000000001",
    subject: "Inquiry about property boundary survey",
    description: "I submitted a property request yesterday and wanted to confirm the surveyor accreditation.",
    category: "Service Inquiry",
    status: "RESOLVED",
    priority: "NORMAL",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const userTickets = supportTicketsStore.filter(
    (t) => t.userId === user.sub || user.role === "ADMIN"
  );

  return NextResponse.json<PaginatedResponse<SupportTicket>>({
    success: true,
    data: userTickets,
    pagination: {
      page: 1,
      limit: 20,
      total: userTickets.length,
      totalPages: 1,
    },
  });
});

export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const { subject, description, category } = body;

    if (!subject || !description) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "subject and description are required",
          },
        },
        { status: 400 }
      );
    }

    const newTicket: SupportTicket = {
      id: `tkt-${Date.now().toString().slice(-6)}`,
      userId: user.sub,
      subject,
      description,
      category: category || "General Support",
      status: "OPEN",
      priority: "NORMAL",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    supportTicketsStore.unshift(newTicket);

    return NextResponse.json<ApiResponse<SupportTicket>>(
      {
        success: true,
        data: newTicket,
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
});
