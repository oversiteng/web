import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";

function resolveWatermarkLogoPath(): string | null {
  const candidates = [
    path.join(process.cwd(), "public", "assets", "app-icons", "oversite_logo.png"),
    path.join(process.cwd(), "public", "assets", "app-icons", "oversite_icon180x180.png"),
    path.join(process.cwd(), "public", "assets", "images", "logo", "app-logo.png"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export interface ReportPdfInput {
  reportId: string;
  watermarkCode: string;
  taskTitle: string;
  moduleType: string;
  locationAddress: string;
  operativeCode: string;
  status: string;
  severity: string;
  completionPct: number;
  summary: string | null;
  findings: string | null;
  officialNotes: string | null;
  measurements: unknown;
  checklist: unknown;
  compiledAt: string;
}

export async function generateWatermarkedReportPdf(
  input: ReportPdfInput
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 48,
      info: {
        Title: `Oversite Verification Dossier - ${input.taskTitle}`,
        Author: "Oversite.ng",
        Subject: `Dossier ${input.watermarkCode}`,
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const logoPath = resolveWatermarkLogoPath();

    const drawWatermark = () => {
      doc.save();
      doc.rotate(-35, { origin: [297, 421] });
      if (logoPath) {
        try {
          doc.opacity(0.08);
          doc.image(logoPath, 197, 290, { fit: [200, 90], align: "center", valign: "center" });
        } catch {
          // Ignore image decode errors and keep text watermark
        }
      }
      doc.fillColor("#94a3b8").opacity(0.12);
      doc.fontSize(30).font("Helvetica-Bold");
      doc.text(`OVERSITE VERIFIED · ${input.watermarkCode}`, 40, 395, {
        align: "center",
        width: 520,
      });
      doc.restore();
      doc.opacity(1).fillColor("#0f172a");
    };

    drawWatermark();
    doc.on("pageAdded", drawWatermark);

    // Header
    doc.rect(48, 44, 499, 54).fill("#0b1410");
    doc.fillColor("#10b981").fontSize(18).font("Helvetica-Bold");
    doc.text("OVERSITE.NG", 64, 58, { continued: true });
    doc.fillColor("#ffffff").fontSize(12).font("Helvetica");
    doc.text("  |  OFFICIAL VERIFICATION DOSSIER", { align: "left" });

    doc.fillColor("#cbd5e1").fontSize(9);
    doc.text(
      `Dossier Code: ${input.watermarkCode}   ·   Compiled: ${input.compiledAt}`,
      64,
      80
    );

    doc.moveDown(2.2);
    doc.fillColor("#0f172a");

    // Task Metadata
    doc.fontSize(16).font("Helvetica-Bold").text(input.taskTitle, 48, 120);
    doc.moveDown(0.5);

    doc.fontSize(10).font("Helvetica").fillColor("#475569");
    doc.text(`Module: ${input.moduleType}   |   Status: ${input.status}   |   Completion: ${input.completionPct}%`);
    doc.text(`Location: ${input.locationAddress}`);
    doc.text(`Assigned Operative: ${input.operativeCode}   |   Risk / Severity: ${input.severity}`);

    doc.moveDown(1);
    doc.moveTo(48, doc.y).lineTo(547, doc.y).strokeColor("#e2e8f0").stroke();
    doc.moveDown(1);

    const writeSection = (heading: string, content: string | null) => {
      if (!content) return;
      doc.fillColor("#0f172a").fontSize(12).font("Helvetica-Bold").text(heading);
      doc.moveDown(0.3);
      doc.fillColor("#334155").fontSize(10).font("Helvetica").text(content, {
        lineGap: 3,
      });
      doc.moveDown(0.9);
    };

    writeSection("Executive Summary", input.summary || "Field verification completed.");
    writeSection("Field Findings", input.findings);
    writeSection("Official Oversite QA Notes", input.officialNotes);

    if (
      input.measurements &&
      typeof input.measurements === "object" &&
      Object.keys(input.measurements as Record<string, unknown>).length > 0
    ) {
      writeSection(
        "Recorded Measurements",
        JSON.stringify(input.measurements, null, 2)
      );
    }

    if (Array.isArray(input.checklist) && input.checklist.length > 0) {
      doc.fillColor("#0f172a").fontSize(12).font("Helvetica-Bold").text("Inspection Checklist");
      doc.moveDown(0.3);
      doc.fontSize(10).font("Helvetica").fillColor("#334155");
      for (const item of input.checklist) {
        const label =
          typeof item === "string"
            ? item
            : (item as any)?.label || (item as any)?.title || JSON.stringify(item);
        const checked = typeof item === "object" && (item as any)?.checked ? "[✓]" : "[•]";
        doc.text(`${checked} ${label}`);
      }
      doc.moveDown(1);
    }

    // Footer
    doc.moveDown(1);
    doc
      .fontSize(8.5)
      .fillColor("#64748b")
      .text(
        `Issued by Oversite.ng · ${input.watermarkCode}`,
        { align: "center" }
      );

    doc.end();
  });
}

