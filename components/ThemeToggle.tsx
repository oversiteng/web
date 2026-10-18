"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
      className={
        className ??
        "w-9 h-9 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] flex items-center justify-center transition-colors shadow-xs"
      }
      aria-label="Toggle theme"
      title={
        mounted
          ? `Switch to ${resolvedTheme === "light" ? "dark" : "light"} mode`
          : "Toggle theme"
      }
    >
      {mounted ? (
        resolvedTheme === "light" ? (
          <Moon className="w-4 h-4 text-[var(--text-heading)]" />
        ) : (
          <Sun className="w-4 h-4 text-amber-400" />
        )
      ) : (
        <span className="w-4 h-4" />
      )}
    </button>
  );
}
