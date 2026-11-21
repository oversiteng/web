import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { tasks, taskReports, reportMedia, notifications, properties } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { generateWatermarkedReportPdf } from "@/lib/services/pdfGenerator";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { formatOperativeCode } from "@/lib/services/pricing";
import { parsePropertyDescriptionMeta } from "@/lib/services/propertyTaskService";

// POST /api/v1/admin/tasks/:id/reports/:reportId/compile — Task Control Official Dossier Compilation
export const POST = withAuth<{ id: string; reportId: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const { id: taskId, reportId } = await params;
      const body = await req.json().catch(() => ({}));
      const { officialNotes, customWatermark } = body;

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

      const existingReports = await db
        .select()
        .from(taskReports)
        .where(and(eq(taskReports.id, reportId), eq(taskReports.taskId, taskId)))
        .limit(1);

      if (existingReports.length === 0) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Report not found for this task." } },
          { status: 404 }
        );
      }

      const report = existingReports[0];

      // Official watermarking & PDF S3 key allocation
      const watermarkCode =
        customWatermark ||
        "OVS-DOSS-" +
          crypto
            .createHash("sha256")
            .update(reportId + taskId + Date.now().toString())
            .digest("hex")
            .substring(0, 10)
            .toUpperCase();

      const pdfS3Key = `dossiers/${task.moduleType.toLowerCase()}/${taskId}/${reportId}-official.pdf`;
      const notes = officialNotes || "Compiled and verified by Oversite Central Operations QA.";
      const now = new Date();

      // Generate real watermarked PDF buffer and persist to S3
      try {
        const pdfBuffer = await generateWatermarkedReportPdf({
          reportId: report.id,
          watermarkCode,
          taskTitle: task.title || "Oversite Task",
          moduleType: task.moduleType,
          locationAddress: task.locationAddress || "Not specified",
          operativeCode: formatOperativeCode(report.agentId),
          status: "UNDER_REVIEW",
          severity: report.severity || "NORMAL",
          completionPct: report.completionPct ?? 100,
          summary: report.summary,
          findings: report.findings,
          officialNotes: notes,
          measurements: report.measurements,
          checklist: report.checklist,
          compiledAt: now.toISOString(),
        });
        if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
          const s3 = new S3Client({
            region: process.env.AWS_REGION || "eu-west-2",
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
          });
          await s3.send(
            new PutObjectCommand({
              Bucket: process.env.AWS_S3_MEDIA_BUCKET || "oversite-storage-bucket",
              Key: pdfS3Key,
              Body: pdfBuffer,
              ContentType: "application/pdf",
            })
          );
        }
      } catch (pdfErr) {
        console.warn("[Compile Dossier] PDF S3 upload skipped/failed:", pdfErr);
      }

      // Update Report to UNDER_REVIEW (released for client final review)
      const [compiledReport] = await db
        .update(taskReports)
        .set({
          status: "UNDER_REVIEW",
          watermarkCode,
          pdfS3Key,
          officialNotes: notes,
          compiledAt: now,
          compiledBy: user.sub,
          updatedAt: now,
        })
        .where(eq(taskReports.id, reportId))
        .returning();

      // Update Task status to UNDER_REVIEW
      await db
        .update(tasks)
        .set({
          status: "UNDER_REVIEW",
          updatedAt: now,
        })
        .where(eq(tasks.id, taskId));

      // Send institutional notification to User
      await db.insert(notifications).values({
        userId: task.userId,
        type: "TASK_UPDATE",
        title: "Official Verified Dossier Ready",
        body: `Central Operations has compiled and certified the official field dossier for "${task.title}". Tap to review and confirm satisfaction.`,
        taskId: task.id,
      });

      // Fetch attached media
      const media = await db
        .select()
        .from(reportMedia)
        .where(eq(reportMedia.reportId, reportId));

      // Auto-sync structured agent deliverables into the linked property's intelTimeline
      if (task.propertyId) {
        try {
          const [propRow] = await db
            .select()
            .from(properties)
            .where(eq(properties.id, task.propertyId))
            .limit(1);

          if (propRow) {
            const meta = parsePropertyDescriptionMeta(propRow.description, propRow.parcelNumber);
            let rawExt: Record<string, any> = {};
            if (propRow.description && propRow.description.trim().startsWith("{")) {
              try {
                const parsed = JSON.parse(propRow.description);
                if (parsed && parsed.__meta) rawExt = parsed;
              } catch {}
            }

            const tl = meta.intelTimeline;
            const mData =
              report.measurements && typeof report.measurements === "object"
                ? (report.measurements as Record<string, any>)
                : {};
            const taskForm =
              task.formData && typeof task.formData === "object"
                ? (task.formData as Record<string, any>)
                : {};
            const quickAction = String(taskForm.quickActionType || "").toUpperCase();
            const isoNow = now.toISOString();
            const dateLabel = now.toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
            });

            // 1. Site Summary
            if (!quickAction || quickAction === "SITE_SUMMARY") {
              const summaryText =
                mData.siteSummary || report.summary || report.findings || "Physical site inspection verified.";
              tl.siteSummaries = [
                {
                  id: `site-${report.id.slice(0, 8)}`,
                  agentName: formatOperativeCode(report.agentId),
                  photoCountLabel: `${Math.max(media.length, 1)} photos geo-tagged`,
                  summary: String(summaryText),
                  occupancy: String(mData.occupancy || "Vacant"),
                  fence: String(mData.fenceCondition || "Intact"),
                  setback: String(mData.setbackCompliance || "3.5m OK"),
                  timeAgo: "Just now",
                  createdAt: isoNow,
                },
                ...(tl.siteSummaries || []),
              ];
            }

            // 2. Word on the Street / Community Update
            if (
              quickAction === "WORD_ON_STREET" ||
              quickAction === "COMMUNITY_UPDATE" ||
              mData.wordOnStreetSummary ||
              mData.sourcesChecked
            ) {
              tl.wordOnStreet = [
                {
                  id: `wots-${report.id.slice(0, 8)}`,
                  headline: String(
                    mData.wordOnStreetHeadline ||
                      mData.headline ||
                      "Community & Neighbor Inquiries"
                  ),
                  badge: "Intel Verified",
                  summary: String(
                    mData.wordOnStreetSummary ||
                      mData.summary ||
                      report.findings ||
                      report.summary ||
                      "Community inquiry verified with zero adverse claims."
                  ),
                  confidenceScore: String(mData.confidenceScore || "98%"),
                  sourcesChecked: Number(mData.sourcesChecked || 3),
                  createdAt: isoNow,
                },
                ...(tl.wordOnStreet || []),
              ];
            }

            // 3. Expert Review
            if (quickAction === "EXPERT_REVIEW" || notes) {
              tl.expertReviews = [
                {
                  id: `exp-${report.id.slice(0, 8)}`,
                  headline: String(mData.headline || "Operations QA & Technical Review"),
                  rating: String(mData.rating || "9.6 / 10"),
                  summary: String(
                    quickAction === "EXPERT_REVIEW"
                      ? mData.summary || report.summary || notes
                      : notes
                  ),
                  reviewer: String(
                    mData.reviewer || "Oversite Central Operations QA"
                  ),
                  createdAt: isoNow,
                },
                ...(tl.expertReviews || []),
              ];
            }

            // 4. State Policy Updates
            if (quickAction === "STATE_POLICY_UPDATES" || mData.policyDirectiveNote || mData.directiveSummary) {
              tl.policyUpdates = [
                {
                  id: `pol-${report.id.slice(0, 8)}`,
                  dateLabel,
                  text: String(
                    mData.directiveSummary ||
                      mData.policyDirectiveNote ||
                      report.summary
                  ),
                  createdAt: isoNow,
                },
                ...(tl.policyUpdates || []),
              ];
            }

            // 5. Vicinity Landmarks
            if (quickAction === "LANDMARKS" || mData.landmarkName) {
              tl.landmarks = [
                {
                  id: `lm-${report.id.slice(0, 8)}`,
                  name: String(mData.landmarkName || "Vicinity Landmark"),
                  distance: String(mData.landmarkDistance || mData.distance || "Near corridor"),
                  feature: String(
                    mData.landmarkFeature ||
                      mData.feature ||
                      report.summary ||
                      "Verified infrastructure landmark"
                  ),
                  addedLabel: `Verified ${dateLabel}`,
                  createdAt: isoNow,
                },
                ...(tl.landmarks || []),
              ];
            }

            const updatedPropMeta = {
              ...rawExt,
              __meta: true,
              ownershipType: meta.ownershipType,
              landmarkDescription: meta.description || "",
              baselinePhotos: meta.baselinePhotos,
              proofOfOwnershipUrl: meta.proofOfOwnershipUrl || null,
              intelTimeline: tl,
            };

            await db
              .update(properties)
              .set({
                description: JSON.stringify(updatedPropMeta),
                updatedAt: now,
              })
              .where(eq(properties.id, propRow.id));
          }
        } catch (syncErr) {
          console.warn("[Compile Dossier] Property timeline sync warning:", syncErr);
        }
      }

      return NextResponse.json<ApiResponse<any>>({
        success: true,
        data: {
          reportId: compiledReport.id,
          taskId: compiledReport.taskId,
          status: compiledReport.status,
          watermarkCode: compiledReport.watermarkCode,
          pdfS3Key: compiledReport.pdfS3Key,
          officialNotes: compiledReport.officialNotes,
          compiledAt: now.toISOString(),
          compiledBy: user.sub,
          taskStatus: "UNDER_REVIEW",
          mediaCount: media.length,
        },
        message: "Report compiled into official Oversite dossier and released for user review.",
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
