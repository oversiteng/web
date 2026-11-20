"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ZoomIn, ZoomOut, Download, FileText, Loader2 } from "lucide-react";

export default function TaskReportPdfViewerPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = String(params?.id || "");

  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState<number>(100);

  useEffect(() => {
    async function loadReport() {
      try {
        const res = await fetch(`/api/v1/tasks/${taskId}/reports`, {
          credentials: "include",
        });
        const json = await res.json().catch(() => ({}));
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setReport(json.data[0]);
        }
      } catch (err) {
        console.error("Failed to load task report:", err);
      } finally {
        setIsLoading(false);
      }
    }
    if (taskId) loadReport();
  }, [taskId]);

  // Block Ctrl+P / Cmd+P print shortcut on the viewer page
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const pdfInlineUrl = report?.id ? `/api/v1/reports/${report.id}/pdf` : null;

  const handleZoomOut = () => setZoom((z) => Math.max(50, z - 25));
  const handleZoomIn = () => setZoom((z) => Math.min(200, z + 25));
  const handleDownload = () => {
    if (!pdfInlineUrl) return;
    window.open(`${pdfInlineUrl}?download=1`, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="relative flex flex-col h-[calc(100vh-64px)] w-full bg-[var(--bg-main)] overflow-hidden print:hidden select-none"
    >
      {/* Minimal Floating Back Button */}
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Go back"
        className="absolute top-3 left-3 z-20 w-9 h-9 rounded-full bg-[var(--bg-card)]/90 border border-[var(--border-color)] shadow-md flex items-center justify-center text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] cursor-pointer backdrop-blur-sm"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      {/* Plain Full-Bleed Vector-Sharp PDF Preview */}
      <div className="flex-1 min-h-0 w-full flex items-stretch justify-center">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading PDF...</span>
          </div>
        ) : pdfInlineUrl ? (
          <iframe
            key={zoom}
            src={`${pdfInlineUrl}#toolbar=0&navpanes=0&zoom=${zoom}`}
            title="Oversite Certified Report PDF"
            className="w-full h-full border-0 bg-white"
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-2">
            <FileText className="w-10 h-10 text-[var(--text-muted)] opacity-50" />
            <p className="text-sm font-semibold text-[var(--text-heading)]">
              Official PDF Report Pending Compilation
            </p>
            <p className="text-xs text-[var(--text-muted)] max-w-sm">
              Once Oversite Operations compiles this report, your PDF dossier will render here.
            </p>
          </div>
        )}
      </div>

      {/* Minimal Floating Zoom & Download Control */}
      {pdfInlineUrl && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 px-2 py-1.5 rounded-full bg-[var(--bg-card)]/95 border border-[var(--border-color)] shadow-lg backdrop-blur-sm">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            aria-label="Zoom out"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] cursor-pointer disabled:opacity-40"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-[var(--text-heading)] min-w-[44px] text-center tabular-nums">
            {zoom}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 200}
            aria-label="Zoom in"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] cursor-pointer disabled:opacity-40"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-[var(--border-color)] mx-1" />
          <button
            type="button"
            onClick={handleDownload}
            aria-label="Download PDF"
            title="Download PDF"
            className="min-w-8 h-8 rounded-full flex items-center justify-center text-[var(--primary)] hover:text-[var(--primary)]/50 cursor-pointer"
          >
            <Download className="w-4 h-4 mr-1" /> Download
          </button>
        </div>
      )}
    </div>
  );
}
