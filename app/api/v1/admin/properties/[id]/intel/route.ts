import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { PropertyIntelTimeline } from "@/lib/types/task";
import { getDbReady } from "@/lib/db/client";
import { properties, tasks, taskChats } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { parsePropertyDescriptionMeta } from "@/lib/services/propertyTaskService";

// POST /api/v1/admin/properties/:id/intel
// Allows Admin to publish a new timeline entry (newest at the top) for:
// - SITE_SUMMARY ("Latest Site Summary")
// - WORD_ON_STREET ("Word on the Street")
// - EXPERT_REVIEW ("Expert Review Report")
// - POLICY_UPDATE ("States Policy Updates")
// - LANDMARK ("Landmarks")
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const { id: propertyId } = await params;
      const body = await req.json();
      const { category, entry, clearanceStatus } = body;

      const db = await getDbReady();
      const [prop] = await db
        .select()
        .from(properties)
        .where(eq(properties.id, propertyId))
        .limit(1);

      if (!prop) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "NOT_FOUND", message: "Property not found" },
          },
          { status: 404 }
        );
      }

      const meta = parsePropertyDescriptionMeta(prop.description, prop.parcelNumber);
      const timeline: PropertyIntelTimeline = { ...meta.intelTimeline };
      const now = new Date();
      const nowIso = now.toISOString();

      let chatTitle = "Property Intelligence Update";
      let chatDetails = "A new property intelligence entry was published by Oversite.";

      if (clearanceStatus) {
        timeline.clearanceStatus = String(clearanceStatus);
      }

      if (category === "SITE_SUMMARY" && entry) {
        const newItem = {
          id: `ss-${Date.now()}`,
          agentName: entry.agentName || "Tunde C.",
          photoCountLabel: entry.photoCountLabel || "12 photos geo-tagged",
          summary:
            entry.summary ||
            "Physical site inspection completed. Perimeter fence intact and soil condition stable.",
          occupancy: entry.occupancy || "Vacant",
          fence: entry.fence || "Intact",
          setback: entry.setback || "3.5m OK",
          timeAgo: "Just now",
          createdAt: nowIso,
        };
        timeline.siteSummaries = [newItem, ...(timeline.siteSummaries || [])];
        chatTitle = "Latest Site Summary Updated";
        chatDetails = newItem.summary;
      } else if (category === "WORD_ON_STREET" && entry) {
        const newItem = {
          id: `wos-${Date.now()}`,
          headline: entry.headline || "Community & Neighbor Inquiries",
          badge: entry.badge || "Intel Verified",
          summary:
            entry.summary ||
            "Community & neighbor inquiries completed. No communal claims or encroachment threats reported.",
          confidenceScore: entry.confidenceScore || "98%",
          sourcesChecked: Number(entry.sourcesChecked || 3),
          createdAt: nowIso,
        };
        timeline.wordOnStreet = [newItem, ...(timeline.wordOnStreet || [])];
        chatTitle = `Word on the Street: ${newItem.headline}`;
        chatDetails = newItem.summary;
      } else if (category === "EXPERT_REVIEW" && entry) {
        const newItem = {
          id: `er-${Date.now()}`,
          headline: entry.headline || "Unified Recommendation",
          rating: entry.rating || "9.6 / 10",
          summary:
            entry.summary ||
            "Site survey beacon coordinates match the approved state cadastral layout.",
          reviewer:
            entry.reviewer ||
            "Engr. Babatunde A. (COREN, Lead Civil Reviewer)",
          createdAt: nowIso,
        };
        timeline.expertReviews = [newItem, ...(timeline.expertReviews || [])];
        chatTitle = `Expert Review Report (${newItem.rating})`;
        chatDetails = newItem.summary;
      } else if (category === "POLICY_UPDATE" && entry) {
        const formattedDate =
          entry.dateLabel ||
          now.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        const newItem = {
          id: `pol-${Date.now()}`,
          dateLabel: formattedDate,
          text:
            entry.text ||
            "Statutory layout & physical planning compliance directive updated.",
          createdAt: nowIso,
        };
        timeline.policyUpdates = [newItem, ...(timeline.policyUpdates || [])];
        chatTitle = "New State Policy Directive Published";
        chatDetails = newItem.text;
      } else if (category === "LANDMARK" && entry) {
        const formattedAdded =
          entry.addedLabel ||
          `Added ${now.toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          })}`;
        const newItem = {
          id: `lm-${Date.now()}`,
          name: entry.name || "Verified Vicinity Landmark",
          distance: entry.distance || "1.0 km (3 mins)",
          feature:
            entry.feature || "Verified vicinity transit & infrastructure node",
          addedLabel: formattedAdded,
          createdAt: nowIso,
        };
        timeline.landmarks = [newItem, ...(timeline.landmarks || [])];
        chatTitle = `New Vicinity Landmark Verified: ${newItem.name}`;
        chatDetails = `${newItem.distance} · ${newItem.feature}`;
      }

      const serializedDescription = JSON.stringify({
        __meta: true,
        ownershipType: meta.ownershipType,
        landmarkDescription: meta.description || "",
        baselinePhotos: meta.baselinePhotos,
        proofOfOwnershipUrl: meta.proofOfOwnershipUrl || null,
        intelTimeline: timeline,
      });

      await db
        .update(properties)
        .set({
          description: serializedDescription,
          updatedAt: now,
        })
        .where(eq(properties.id, propertyId));

      // Also broadcast a reference card to the property's Oversite chat thread
      const [propTask] = await db
        .select()
        .from(tasks)
        .where(eq(tasks.propertyId, propertyId))
        .orderBy(desc(tasks.createdAt))
        .limit(1);

      if (propTask) {
        const cardPayload = JSON.stringify({
          cardType: "MILESTONE_SUBMISSION",
          milestoneTitle: chatTitle,
          stageDetails: chatDetails,
          status: "Published by Oversite",
          targetLink: `/properties/${propertyId}`,
          timestamp: now.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          }),
        });

        await db.insert(taskChats).values({
          taskId: propTask.id,
          senderId: user.sub,
          receiverId: prop.userId,
          rawMessage: cardPayload,
          moderatedMessage: cardPayload,
          message: cardPayload,
          messageType: "MILESTONE_UPDATE",
          isModerated: true,
          moderationStatus: "APPROVED_AS_IS",
          moderatedBy: user.sub,
          moderatedAt: now,
        });
      }

      return NextResponse.json<ApiResponse<PropertyIntelTimeline>>({
        success: true,
        data: timeline,
        message: "Property intelligence timeline updated (newest entry added at top).",
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
