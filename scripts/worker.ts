import { dequeueNextJob } from "@/lib/queue/backgroundQueue";
import { getDb } from "@/lib/db/client";
import { taskReports, tasks, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

// Mock S3 upload for local development (saves to public/uploads)
async function uploadToS3(buffer: Buffer, key: string): Promise<string> {
  // In production, this would use @aws-sdk/client-s3 to putObject
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filename = path.basename(key);
  const filePath = path.join(uploadsDir, filename);
  fs.writeFileSync(filePath, buffer);

  return `/uploads/${filename}`; // Return local URL for development
}

async function processGenerateWatermarkPdf(reportId: string) {
  const db = getDb();

  // 1. Fetch Report, Task, and User details
  const reportRecords = await db
    .select()
    .from(taskReports)
    .where(eq(taskReports.id, reportId))
    .limit(1);

  if (reportRecords.length === 0) throw new Error("Report not found");
  const report = reportRecords[0];

  const taskRecords = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, report.taskId))
    .limit(1);
  const task = taskRecords[0];

  const userRecords = await db
    .select()
    .from(users)
    .where(eq(users.id, task.userId))
    .limit(1);
  const user = userRecords[0];

  // 2. Generate PDF with watermark
  return new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers: Buffer[] = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", async () => {
      try {
        const pdfBuffer = Buffer.concat(buffers);
        const s3Key = `reports/${reportId}/final_dossier_${Date.now()}.pdf`;

        // 3. Upload to S3 (Mocked to local for now)
        const pdfUrl = await uploadToS3(pdfBuffer, s3Key);

        // 4. Update the Database (Save S3 Key, Mark APPROVED)
        await db.update(taskReports)
          .set({
            pdfS3Key: pdfUrl,
            status: "APPROVED",
            updatedAt: new Date()
          })
          .where(eq(taskReports.id, reportId));

        // 5. Update Task status to COMPLETED
        await db.update(tasks)
          .set({ status: "COMPLETED", updatedAt: new Date() })
          .where(eq(tasks.id, task.id));

        console.log(`[Worker] PDF Generated and Uploaded for Report ${reportId}`);
        resolve();
      } catch (err) {
        reject(err);
      }
    });

    // --- PDF CONTENT DESIGN ---

    // Background Watermark (Oversite Logo)
    const logoPath = path.join(process.cwd(), "public", "assets", "app-icons", "oversite_logo.png");
    if (fs.existsSync(logoPath)) {
      doc.opacity(0.15); // Make it slightly transparent
      doc.image(logoPath, 140, 350, { width: 300 });
      doc.opacity(1); // Reset opacity
    } else {
      doc.fillOpacity(0.1)
        .fontSize(60)
        .fillColor("red")
        .text("OVERSITE CONFIDENTIAL", 50, 400, { align: "center" })
        .fillOpacity(1)
        .fillColor("black");
    }

    // Header
    doc.fontSize(24).fillColor("#1a1a1a").text("OVERSITE DOSSIER", { align: "center" });
    doc.moveDown();
    doc.fontSize(10).fillColor("#666666").text(`Report ID: ${reportId}`, { align: "right" });
    doc.text(`Generated: ${new Date().toLocaleString()}`, { align: "right" });
    doc.moveDown(2);

    // Client Details Section
    doc.fontSize(16).fillColor("#000000").text("1. Client Information", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Name: ${user?.name || 'Unknown'}`);
    doc.text(`Email: ${user?.email || 'Unknown'}`);
    doc.moveDown(1.5);

    // Task Specifications Section
    doc.fontSize(16).text("2. Task Specifications", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Title: ${task.title}`);
    doc.text(`Module Type: ${task.moduleType}`);
    doc.text(`Location: ${task.locationAddress || "N/A"}`);
    doc.moveDown(1.5);

    // Investigation Findings Section
    doc.fontSize(16).text("3. Investigation Findings", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text("Summary:", { continued: true }).text(` ${report.summary || "No summary provided."}`);
    doc.moveDown();
    doc.text("Detailed Findings:");
    doc.text(report.findings || "No detailed findings provided.", {
      align: "justify",
      indent: 20
    });

    // Footer
    doc.fontSize(9).fillColor("#999999")
      .text("This document is strictly confidential and protected by Oversite.ng terms of service. Unauthorized distribution is prohibited.",
        50, doc.page.height - 50, { align: "center" });

    doc.end();
  });
}

// --- Main Worker Loop ---
async function startWorker() {
  console.log("[Worker] Started background processing loop...");

  while (true) {
    try {
      const job = await dequeueNextJob();

      if (job) {
        console.log(`[Worker] Processing Job: ${job.type} (ID: ${job.id})`);

        switch (job.type) {
          case "GENERATE_WATERMARK_PDF":
            await processGenerateWatermarkPdf(job.data.reportId);
            break;

          case "SEND_EMAIL":
            console.log(`[Worker] Sending email to ${job.data.to}`);
            // Mock email sending
            break;

          case "AUTO_RELEASE_ESCROW":
            console.log(`[Worker] Releasing escrow for Task ${job.data.taskId}`);
            // Mock escrow release
            break;

          default:
            console.log(`[Worker] Unknown job type`);
        }

        console.log(`[Worker] Completed Job: ${job.type} (ID: ${job.id})`);
      } else {
        // No jobs in queue, wait a bit before polling again
        await new Promise(res => setTimeout(res, 3000));
      }
    } catch (err) {
      console.error("[Worker] Job Error:", err);
      // Wait a bit before retrying on error
      await new Promise(res => setTimeout(res, 5000));
    }
  }
}

// Run the worker
startWorker().catch(console.error);
