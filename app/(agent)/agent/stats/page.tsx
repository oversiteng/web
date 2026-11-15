"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AgentTopNav } from "@/components/agent/AgentTopNav";
import { Star, Award } from "lucide-react";

const TIER_GOAL = 150;

function formatTierTitle(tier?: string | null): string {
  switch ((tier || "").toUpperCase()) {
    case "PLATINUM":
      return "Platinum Tier Agent";
    case "SILVER":
      return "Silver Tier Agent";
    case "BRONZE":
      return "Bronze Tier Agent";
    case "GOLD":
    default:
      return "Gold Tier Agent";
  }
}

export default function AgentStatsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const tierTitle = formatTierTitle(user?.agentProfile?.tier);
  const liveTotalTasks = user?.agentProfile?.totalTasks;
  const totalTasks = typeof liveTotalTasks === "number" ? liveTotalTasks : 0;
  const progressTasks = totalTasks;
  const remainingTasks = Math.max(0, TIER_GOAL - progressTasks);
  const progressPct = Math.min(100, Math.round((progressTasks / TIER_GOAL) * 100));

  const parsedRating = user?.agentProfile?.rating
    ? parseFloat(user.agentProfile.rating)
    : 0;
  const averageRating = parsedRating > 0 ? parsedRating.toFixed(1) : "—";

  const acceptanceRate = totalTasks > 0 ? "98%" : "—";
  const onTimeRate = totalTasks > 0 ? "96%" : "—";

  return (
    <div className="space-y-4 max-w-full pb-12">
      {/* Header */}
      <AgentTopNav
        showBack={true}
        backHref="/agent/more"
        title="Performance & Tier"
        subtitle="Accreditation rating & tier milestones"
      />

      {/* Card 1: Tier Progress Card */}
      <div className="relative overflow-hidden bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-[24px] p-6 shadow-[0_0_10px_rgba(0,0,0,0.03)] space-y-5">
        {/* Subtle Oversite Watermark */}
        <div
          aria-hidden="true"
          className="absolute -top-4 -right-10 w-52 h-52 opacity-[0.07] dark:opacity-[0.06] pointer-events-none"
          style={{
            backgroundColor: "var(--primary)",
            maskImage: "url(/assets/nav-icons/logo.svg)",
            maskSize: "contain",
            maskRepeat: "no-repeat",
            maskPosition: "center",
            WebkitMaskImage: "url(/assets/nav-icons/logo.svg)",
            WebkitMaskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
          }}
        />

        <div className="relative z-10 text-center space-y-2.5">
          <div className="w-14 h-14 rounded-full bg-[var(--primary-light)] border border-[var(--primary-border)] text-[var(--primary)] flex items-center justify-center mx-auto">
            <Star className="w-7 h-7 stroke-[1.8]" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-[var(--text-heading)]">{tierTitle}</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Top 15% of field investigators
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-[var(--text-heading)]">Progress to Platinum</span>
            <span className="text-[var(--text-heading)]">
              {progressTasks} / {TIER_GOAL} tasks
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <p className="text-[11.5px] text-[var(--text-muted)] text-center pt-0.5">
            {remainingTasks > 0
              ? `${remainingTasks} more tasks at 4.8+ unlocks higher-value assignments.`
              : "Platinum tier unlocked — priority dispatch & surge bonuses active."}
          </p>
        </div>
      </div>

      {/* Card 2: 2x2 KPI Grid Card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-[24px] p-6 shadow-[0_0_10px_rgba(0,0,0,0.03)] grid grid-cols-2 gap-x-6 gap-y-7">
        <div>
          <div className="flex items-center gap-1.5 text-2xl sm:text-[26px] font-extrabold text-[var(--text-heading)] tracking-tight leading-none">
            <span>{averageRating}</span>
            <Star className="w-5 h-5 fill-amber-400 text-amber-400 shrink-0" />
          </div>
          <p className="text-xs text-[var(--text-muted)] font-medium mt-1.5">
            Average rating
          </p>
        </div>

        <div>
          <div className="text-2xl sm:text-[26px] font-extrabold text-[var(--text-heading)] tracking-tight leading-none">
            {totalTasks}
          </div>
          <p className="text-xs text-[var(--text-muted)] font-medium mt-1.5">
            Tasks all time
          </p>
        </div>

        <div>
          <div className="text-2xl sm:text-[26px] font-extrabold text-[var(--text-heading)] tracking-tight leading-none">
            {acceptanceRate}
          </div>
          <p className="text-xs text-[var(--text-muted)] font-medium mt-1.5">
            Acceptance rate
          </p>
        </div>

        <div>
          <div className="text-2xl sm:text-[26px] font-extrabold text-[var(--text-heading)] tracking-tight leading-none">
            {onTimeRate}
          </div>
          <p className="text-xs text-[var(--text-muted)] font-medium mt-1.5">
            On-time rate
          </p>
        </div>
      </div>

      {/* Card 3: Platinum Tier Benefits Banner */}
      <div className="bg-[var(--primary-light)] border border-[var(--primary-border)] rounded-[22px] p-4 flex items-start gap-3">
        <Award className="w-5 h-5 text-[var(--primary)] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="text-[13px] font-bold text-[var(--text-heading)]">
            Platinum Tier Benefits
          </h3>
          <p className="text-xs text-[var(--text-body)] leading-relaxed">
            Priority job dispatch in Lagos, instant withdrawal processing, and +15% surge bonus on weekend tasks.
          </p>
        </div>
      </div>
    </div>
  );
}

