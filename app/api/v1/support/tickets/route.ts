import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { getDbReady } from "@/lib/db/client";
import { users, notifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const runtime = "nodejs";

export interface SupportMessageItem {
  id: string;
  sender: "user" | "agent"; // "user" = client/operative, "agent" = Oversite CRS Support Admin
  senderName: string;
  senderRole: string;
  text: string;
  createdAt: string;
}

export interface SupportTicketRecord {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string | null;
  userRole: string;
  status: "OPEN" | "PENDING_USER" | "RESOLVED";
  priority: "NORMAL" | "HIGH" | "URGENT";
  category: string;
  updatedAt: string;
  messages: SupportMessageItem[];
}

export interface SupportFaqItem {
  id: string;
  q: string;
  a: string;
  category?: string;
}

const DEFAULT_SUPPORT_FAQS: SupportFaqItem[] = [
  {
    id: "faq-1",
    q: "How do milestone inspections and verifications work?",
    a: "Oversite deploys certified field operatives (identified by their OS-XXXXXX code) to conduct physical on-site visits with geo-tagged high-resolution photos, measurements, and verification reports compiled directly into your Oversite Vault.",
    category: "Operations",
  },
  {
    id: "faq-2",
    q: "Who executes my requested task?",
    a: "When you request and pay for a service, Oversite manages the entire execution end-to-end. You communicate directly with Oversite Command & Support while our vetted field operatives carry out the physical assignment.",
    category: "Execution",
  },
  {
    id: "faq-3",
    q: "How fast are field operatives dispatched?",
    a: "Standard dispatches occur within 24–48 hours of payment confirmation. Priority and Emergency Enforcement requests are dispatched on a same-day schedule.",
    category: "Logistics",
  },
  {
    id: "faq-4",
    q: "How do Field Operatives receive their task pay?",
    a: "Field Operatives see the exact task payout on their assignment queue. Once their field report and deliverables are audited and approved by Oversite QA, the full displayed task payout is credited directly to their Operative Wallet.",
    category: "Operatives",
  },
];

/**
 * GET /api/v1/support/tickets
 * - If called by ADMIN / SUPER_ADMIN with ?mode=admin: returns all user/operative support threads + FAQs
 * - Otherwise: returns the authenticated user's own support thread + public FAQs
 */
export const GET = withAuth(async (req: NextRequest, { user }) => {
  try {
    const db = await getDbReady();
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode");

    // Fetch platform FAQs from SUPER_ADMIN config or fallback to defaults
    const superAdmins = await db
      .select({ accreditationDocuments: users.accreditationDocuments })
      .from(users)
      .where(eq(users.role, "SUPER_ADMIN"))
      .limit(1);

    let faqs: SupportFaqItem[] = DEFAULT_SUPPORT_FAQS;
    if (superAdmins.length > 0 && superAdmins[0].accreditationDocuments) {
      const saDocs = superAdmins[0].accreditationDocuments as Record<string, any>;
      if (Array.isArray(saDocs.supportFaqs) && saDocs.supportFaqs.length > 0) {
        faqs = saDocs.supportFaqs;
      }
    }

    if (
      mode === "admin" &&
      (user.role === "ADMIN" || user.role === "SUPER_ADMIN")
    ) {
      const allUsers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          role: users.role,
          accreditationDocuments: users.accreditationDocuments,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .orderBy(desc(users.updatedAt))
        .limit(300);

      const tickets: SupportTicketRecord[] = [];
      for (const u of allUsers) {
        const docs =
          u.accreditationDocuments &&
          typeof u.accreditationDocuments === "object"
            ? (u.accreditationDocuments as Record<string, any>)
            : {};

        if (docs.supportTicket && Array.isArray(docs.supportTicket.messages)) {
          const st = docs.supportTicket;
          tickets.push({
            userId: u.id,
            userName: u.name || u.email,
            userEmail: u.email,
            userPhone: u.phone,
            userRole: u.role,
            status: st.status || "OPEN",
            priority: st.priority || "NORMAL",
            category: st.category || "General Support",
            updatedAt: st.updatedAt || u.updatedAt.toISOString(),
            messages: st.messages,
          });
        }
      }

      tickets.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      return NextResponse.json({
        success: true,
        data: {
          tickets,
          faqs,
          summary: {
            totalTickets: tickets.length,
            openTickets: tickets.filter((t) => t.status === "OPEN").length,
            pendingUser: tickets.filter((t) => t.status === "PENDING_USER")
              .length,
            resolvedTickets: tickets.filter((t) => t.status === "RESOLVED")
              .length,
          },
        },
      });
    }

    // Regular User or Agent fetching their own support chat thread
    const [dbUser] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        accreditationDocuments: users.accreditationDocuments,
      })
      .from(users)
      .where(eq(users.id, user.sub))
      .limit(1);

    const docs =
      dbUser?.accreditationDocuments &&
      typeof dbUser.accreditationDocuments === "object"
        ? (dbUser.accreditationDocuments as Record<string, any>)
        : {};

    const defaultGreeting: SupportMessageItem = {
      id: "welcome-1",
      sender: "agent",
      senderName: "Oversite CRS Support",
      senderRole: "ADMIN",
      text: "Hello there! Welcome to Oversite Support. How can our Customer Relations & Support team assist you today?",
      createdAt: new Date().toISOString(),
    };

    const existingTicket = docs.supportTicket;
    const messages: SupportMessageItem[] =
      existingTicket &&
      Array.isArray(existingTicket.messages) &&
      existingTicket.messages.length > 0
        ? existingTicket.messages
        : [defaultGreeting];

    return NextResponse.json({
      success: true,
      data: {
        ticket: {
          userId: user.sub,
          status: existingTicket?.status || "OPEN",
          category: existingTicket?.category || "Live Support",
          messages,
        },
        faqs,
      },
    });
  } catch (error) {
    console.error("[GET /api/v1/support/tickets] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to load support messages.",
        },
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/v1/support/tickets
 * - User/Operative sends a message in /support/chat
 * - Or Admin replies to a specific user's ticket from /admin/support
 */
export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const db = await getDbReady();
    const body = await req.json().catch(() => ({}));

    const isAdminReply =
      (user.role === "ADMIN" || user.role === "SUPER_ADMIN") &&
      Boolean(body.targetUserId);

    const targetUserId = isAdminReply ? String(body.targetUserId) : user.sub;
    const text = String(body.text || "").trim();

    if (!text) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Message text is required.",
          },
        },
        { status: 400 }
      );
    }

    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "User not found." },
        },
        { status: 404 }
      );
    }

    const docs =
      targetUser.accreditationDocuments &&
      typeof targetUser.accreditationDocuments === "object"
        ? (targetUser.accreditationDocuments as Record<string, any>)
        : {};

    const currentTicket =
      docs.supportTicket && typeof docs.supportTicket === "object"
        ? docs.supportTicket
        : {
            status: "OPEN",
            priority: "NORMAL",
            category: body.category || "Live Support",
            messages: [
              {
                id: "welcome-1",
                sender: "agent",
                senderName: "Oversite CRS Support",
                senderRole: "ADMIN",
                text: "Hello there! Welcome to Oversite Support. How can our Customer Relations & Support team assist you today?",
                createdAt: new Date().toISOString(),
              },
            ],
          };

    const newMsg: SupportMessageItem = {
      id: `msg-${Date.now()}`,
      sender: isAdminReply ? "agent" : "user",
      senderName: isAdminReply
        ? "Oversite CRS Support"
        : targetUser.name || targetUser.email,
      senderRole: isAdminReply ? user.role : targetUser.role,
      text,
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [
      ...(Array.isArray(currentTicket.messages) ? currentTicket.messages : []),
      newMsg,
    ];

    const updatedTicket = {
      ...currentTicket,
      status: isAdminReply ? body.status || "PENDING_USER" : "OPEN",
      priority: body.priority || currentTicket.priority || "NORMAL",
      category: body.category || currentTicket.category || "Live Support",
      updatedAt: new Date().toISOString(),
      messages: updatedMessages,
    };

    await db
      .update(users)
      .set({
        accreditationDocuments: {
          ...docs,
          supportTicket: updatedTicket,
        },
        updatedAt: new Date(),
      })
      .where(eq(users.id, targetUserId));

    if (isAdminReply) {
      await db.insert(notifications).values({
        userId: targetUserId,
        title: "New Reply from Oversite Support",
        body: text.length > 100 ? `${text.slice(0, 97)}...` : text,
        type: "CHAT",
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        message: newMsg,
        ticket: updatedTicket,
      },
    });
  } catch (error) {
    console.error("[POST /api/v1/support/tickets] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: (error as Error).message || "Failed to send support message.",
        },
      },
      { status: 500 }
    );
  }
});

/**
 * PATCH /api/v1/support/tickets
 * Allows CRS_SUPPORT, EMAIL_CONTENT, or SUPER_ADMIN to:
 * - Update ticket status/priority ({ targetUserId, status, priority })
 * - Update platform FAQs ({ faqs: SupportFaqItem[] })
 */
export const PATCH = withAuth(async (req: NextRequest, { user }) => {
  try {
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Admin access required." },
        },
        { status: 403 }
      );
    }

    const db = await getDbReady();
    const body = await req.json().catch(() => ({}));

    // 1. Update FAQs if provided
    if (Array.isArray(body.faqs)) {
      const superAdmins = await db
        .select()
        .from(users)
        .where(eq(users.role, "SUPER_ADMIN"))
        .limit(1);

      const targetAdmin =
        superAdmins.length > 0
          ? superAdmins[0]
          : (
              await db
                .select()
                .from(users)
                .where(eq(users.id, user.sub))
                .limit(1)
            )[0];

      if (targetAdmin) {
        const docs =
          targetAdmin.accreditationDocuments &&
          typeof targetAdmin.accreditationDocuments === "object"
            ? (targetAdmin.accreditationDocuments as Record<string, any>)
            : {};

        await db
          .update(users)
          .set({
            accreditationDocuments: {
              ...docs,
              supportFaqs: body.faqs,
            },
            updatedAt: new Date(),
          })
          .where(eq(users.id, targetAdmin.id));
      }

      return NextResponse.json({
        success: true,
        data: { faqs: body.faqs },
        message: "Support FAQs updated.",
      });
    }

    // 2. Update a specific user's ticket status or priority
    if (body.targetUserId) {
      const [targetUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, String(body.targetUserId)))
        .limit(1);

      if (!targetUser) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "NOT_FOUND", message: "Ticket user not found." },
          },
          { status: 404 }
        );
      }

      const docs =
        targetUser.accreditationDocuments &&
        typeof targetUser.accreditationDocuments === "object"
          ? (targetUser.accreditationDocuments as Record<string, any>)
          : {};

      const currentTicket = docs.supportTicket || {};
      const updatedTicket = {
        ...currentTicket,
        status: body.status || currentTicket.status || "OPEN",
        priority: body.priority || currentTicket.priority || "NORMAL",
        updatedAt: new Date().toISOString(),
      };

      await db
        .update(users)
        .set({
          accreditationDocuments: {
            ...docs,
            supportTicket: updatedTicket,
          },
          updatedAt: new Date(),
        })
        .where(eq(users.id, targetUser.id));

      return NextResponse.json({
        success: true,
        data: { ticket: updatedTicket },
        message: `Ticket status updated to ${updatedTicket.status}.`,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Provide faqs or targetUserId to update.",
        },
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("[PATCH /api/v1/support/tickets] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to update support ticket.",
        },
      },
      { status: 500 }
    );
  }
});
