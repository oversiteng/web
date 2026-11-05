"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Download, Check, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatTimeAgo } from "@/lib/utils";

type DocCategory = "all" | "property" | "documents" | "diligence";

interface VaultDocItem {
  id: string;
  name: string;
  category: "property" | "documents" | "diligence";
  type: "PDF" | "IMAGE" | "DOCUMENT";
  fileUrl: string;
  taskId?: string;
  taskTitle?: string;
  createdAt: string;
}

const CATEGORIES: { id: DocCategory; label: string }[] = [
  { id: "all", label: "All files" },
  { id: "property", label: "Property" },
  { id: "documents", label: "Documents" },
  { id: "diligence", label: "Due Diligence" },
];

function DocFileIcon({ type }: { type: string }) {
  const displayType = type === "IMAGE" ? "IMG" : type === "DOCUMENT" ? "DOC" : "PDF";
  return (
    <div className="relative w-7 h-9 flex items-center justify-center shrink-0">
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
      <span className="absolute -bottom-1 -left-1 bg-black text-white text-[7.5px] font-bold px-1 py-0.2 rounded-xs tracking-tight border border-zinc-700/60 leading-tight">
        {displayType}
      </span>
    </div>
  );
}

export default function DocumentVaultPage() {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<VaultDocItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<DocCategory>("all");
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadDocuments() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/v1/vault/documents", { credentials: "include", headers });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setDocuments(json.data);
        } else {
          setDocuments([]);
        }
      } catch (err) {
        console.error("Failed to load vault documents:", err);
        setDocuments([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadDocuments();
  }, []);

  useEffect(() => {
    if (isSearching) {
      searchInputRef.current?.focus();
    }
  }, [isSearching]);

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      if (activeCategory !== "all" && doc.category !== activeCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          doc.name.toLowerCase().includes(q) ||
          (doc.taskTitle && doc.taskTitle.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [documents, activeCategory, searchQuery]);

  const handleDownload = (doc: VaultDocItem) => {
    setToastMessage(`Downloading ${doc.name}...`);
    if (doc.fileUrl) {
      window.open(doc.fileUrl, "_blank", "noopener,noreferrer");
    }
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div className="relative w-full text-[var(--text-heading)] pb-16 select-none">
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

      {/* ── Unified Page Header ── */}
      <PageHeader
        title="Document Vault"
        showBack={true}
        onBack={() => {
          if (window.history.length > 1) {
            router.back();
          } else {
            router.push("/more");
          }
        }}
        searchConfig={{
          active: isSearching,
          onActiveChange: setIsSearching,
          query: searchQuery,
          onQueryChange: setSearchQuery,
          placeholder: "Search documents by name...",
        }}
        rightSlot={
          <button
            type="button"
            onClick={() => setIsSearching(true)}
            aria-label="Search documents"
            className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs flex items-center justify-center text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4 stroke-[2.2]" />
          </button>
        }
      />

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
        {isLoading ? (
          <DynamicLoadingState variant="documents" count={4} />
        ) : filteredDocs.length === 0 ? (
          searchQuery ? (
            <EmptyState
              preset="search"
              query={searchQuery}
              action={{
                label: "Clear Search",
                onClick: () => setSearchQuery(""),
              }}
            />
          ) : activeCategory !== "all" ? (
            <EmptyState
              preset="filter"
              action={{
                label: "Show All Files",
                onClick: () => setActiveCategory("all"),
              }}
            />
          ) : (
            <EmptyState
              preset="documents"
              action={{
                label: "Request a Verification Task",
                href: "/dashboard",
              }}
            />
          )
        ) : (
          filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between py-2.5 transition-colors group"
            >
              <div className="flex items-center gap-3.5 min-w-0 pr-4">
                <DocFileIcon type={doc.type} />
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-[var(--text-heading)] truncate leading-snug">
                    {doc.name}
                  </p>
                  <p className="text-[12px] text-[var(--text-muted)] truncate mt-0.5">
                    {doc.taskTitle ? `${doc.taskTitle} · ` : ""}
                    {formatTimeAgo(doc.createdAt)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDownload(doc)}
                aria-label={`Download ${doc.name}`}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4 stroke-[2]" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
