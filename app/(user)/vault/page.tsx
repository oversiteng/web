"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Download, Check, X } from "lucide-react";

type DocCategory = "all" | "property" | "documents" | "diligence";

interface VaultDocument {
  id: string;
  name: string;
  category: "property" | "documents" | "diligence";
  type: "PDF" | "ZIP";
  subtitle: string;
  status?: "pending";
}

const DOCUMENTS: VaultDocument[] = [
  {
    id: "doc-1",
    name: "Vendor Background Check...",
    category: "diligence",
    type: "PDF",
    subtitle: "Spreadsheets · yesterday · 450 KB",
    status: "pending",
  },
  {
    id: "doc-2",
    name: "Ikoyi Site Visit Report.pdf",
    category: "property",
    type: "PDF",
    subtitle: "Property Oversite · today · 2.4 MB",
  },
  {
    id: "doc-3",
    name: "CAC Certified True Copy.pdf",
    category: "documents",
    type: "PDF",
    subtitle: "Documents · today · 1.1 MB",
  },
  {
    id: "doc-4",
    name: "Lekki Boundary Evidence.zip",
    category: "property",
    type: "ZIP",
    subtitle: "Evidence · 4 photos · 9.8 MB",
  },
  {
    id: "doc-5",
    name: "Title Deed Verification.pdf",
    category: "diligence",
    type: "PDF",
    subtitle: "Due Diligence · 3 days ago · 1.8 MB",
  },
  {
    id: "doc-6",
    name: "Survey Plan & Coordinate Chart.pdf",
    category: "property",
    type: "PDF",
    subtitle: "Survey · 5 days ago · 3.5 MB",
  },
];

const CATEGORIES: { id: DocCategory; label: string }[] = [
  { id: "all", label: "All file" },
  { id: "property", label: "Property" },
  { id: "documents", label: "Documents" },
  { id: "diligence", label: "Due Diligence" },
];

function DocFileIcon({ type }: { type: "PDF" | "ZIP" }) {
  return (
    <div className="relative w-7 h-9 flex items-center justify-center shrink-0">
      {/* Document outline with folded top-right corner */}
      <svg
        className="w-7 h-9 text-[var(--text-heading)]"
        viewBox="0 0 28 36"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 3h11l7 7v21a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
        <path d="M16 3v7h7" />
      </svg>
      {/* File type badge at bottom left */}
      <span className="absolute -bottom-1 -left-1 bg-black text-white text-[7.5px] font-bold px-1 py-0.2 rounded-xs tracking-tight border border-zinc-700/60 leading-tight">
        {type}
      </span>
    </div>
  );
}

export default function DocumentVaultPage() {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [activeCategory, setActiveCategory] = useState<DocCategory>("all");
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isSearching) {
      searchInputRef.current?.focus();
    }
  }, [isSearching]);

  const filteredDocs = useMemo(() => {
    return DOCUMENTS.filter((doc) => {
      // Category filter
      if (activeCategory !== "all" && doc.category !== activeCategory) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          doc.name.toLowerCase().includes(q) ||
          doc.subtitle.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeCategory, searchQuery]);

  const handleDownload = (doc: VaultDocument) => {
    setToastMessage(`Downloading ${doc.name}...`);
    setTimeout(() => {
      setToastMessage(`Downloaded ${doc.name}`);
      setTimeout(() => setToastMessage(null), 2500);
    }, 1200);
  };

  return (
    <div className="relative w-full max-w-md mx-auto text-[var(--text-heading)] pb-16 select-none">
      {/* ── Toast Notification Banner ── */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none transition-all duration-300">
          <div className="w-full max-w-sm bg-[var(--bg-card)] text-[var(--text-heading)] px-4 py-3 rounded-2xl shadow-2xl border border-[var(--border-color)] flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-4">
            <div className="w-5 h-5 rounded-full bg-[var(--primary-light)] flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 text-[var(--primary)] stroke-[3]" />
            </div>
            <span className="text-[13px] font-medium tracking-wide truncate">
              {toastMessage}
            </span>
          </div>
        </div>
      )}

      {/* ── Top Header ── */}
      {isSearching ? (
        /* Search Active Header (Screenshot 2) */
        <div className="flex items-center gap-3 py-2.5 mb-6">
          <button
            type="button"
            onClick={() => {
              setIsSearching(false);
              setSearchQuery("");
            }}
            aria-label="Close search"
            className="w-9 h-9 flex items-center justify-center text-[var(--text-heading)] hover:opacity-75 transition-opacity cursor-pointer shrink-0 -ml-1"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <div className="flex-1 flex items-center gap-2.5 rounded-full border-2 border-[var(--primary)] bg-[var(--bg-card)] px-4 py-2 transition-all">
            <Search className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="w-full bg-transparent text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-[var(--text-muted)] hover:text-[var(--text-heading)]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Default Header (Screenshot 1) */
        <div className="relative flex items-center justify-between py-3 mb-6">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push("/more");
              }
            }}
            aria-label="Go back"
            className="w-9 h-9 flex items-center justify-center text-[var(--text-heading)] hover:opacity-75 transition-opacity cursor-pointer -ml-1"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <h1 className="text-[17px] sm:text-[18px] font-semibold text-[var(--text-heading)]">
            Document vault
          </h1>

          <button
            type="button"
            onClick={() => setIsSearching(true)}
            aria-label="Search documents"
            className="w-9 h-9 flex items-center justify-center text-[var(--text-heading)] hover:opacity-75 transition-opacity cursor-pointer -mr-1"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ── Category Filter Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-6 pt-1">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full text-[13px] whitespace-nowrap transition-all cursor-pointer font-medium ${
                isActive
                  ? "bg-[#85e19e] text-zinc-950 font-semibold shadow-xs"
                  : "text-[var(--text-muted)] hover:text-[var(--text-heading)]"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* ── Document List ── */}
      <div className="space-y-4">
        {filteredDocs.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[14px] text-[var(--text-muted)]">
              No documents found
            </p>
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between gap-4 py-2 hover:bg-[var(--bg-secondary)]/50 rounded-xl px-2 transition-colors"
            >
              {/* Left File Icon & Details */}
              <div className="flex items-center gap-4 min-w-0">
                <DocFileIcon type={doc.type} />
                <div className="min-w-0">
                  <h2 className="text-[14px] sm:text-[15px] font-medium text-[var(--text-heading)] truncate">
                    {doc.name}
                  </h2>
                  <p className="text-[12px] text-[var(--text-muted)] mt-0.5 truncate">
                    {doc.subtitle}
                  </p>
                </div>
              </div>

              {/* Right Action / Status Badge */}
              <div className="shrink-0 flex items-center">
                {doc.status === "pending" ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-[#432b0c] border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-400 text-[11px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Pending</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleDownload(doc)}
                    aria-label={`Download ${doc.name}`}
                    className="w-9 h-9 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors cursor-pointer"
                  >
                    <Download className="w-5 h-5 stroke-[1.8]" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
