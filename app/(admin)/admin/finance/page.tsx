"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CreditCard,
  Wallet,
  TrendingUp,
  ArrowUpRight,
  AlertTriangle,
  Check,
  RefreshCw,
} from "lucide-react";
import { formatCurrency, formatTimeAgo } from "@/lib/utils";
import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";

export default function AdminFinancePage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ledger" | "wallets" | "disputes">(
    "ledger"
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  async function loadFinanceData() {
    setIsLoading(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/v1/admin/finance/overview", {
        credentials: "include",
        headers,
      });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Failed to load finance overview:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadFinanceData();
  }, []);

  const handleResolveContested = async (
    taskId: string,
    action: "CREDIT_AGENT" | "REFUND_CLIENT" | "REMEDIATE"
  ) => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/v1/admin/finance/overview", {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ taskId, action }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || "Resolution completed");
        loadFinanceData();
      } else {
        showToast(json.error?.message || "Resolution failed");
      }
    } catch (err: any) {
      showToast(err.message || "Error resolving task");
    }
  };

  const summary = data?.summary || {};

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div className="bg-[var(--bg-card)] border border-[var(--primary-border)] text-[var(--text-heading)] px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold">
            {toastMessage}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-heading)] tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[var(--primary)]" />
            Revenue Ledger, Agent Task Pay Credits & Payouts
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Track direct client payments to Oversite, operative completion credits, platform margins, and bank withdrawals.
          </p>
        </div>
      </div>

      {isLoading ? (
        <DynamicLoadingState variant="documents" count={4} />
      ) : (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1.5">
                <span>Gross Client Revenue</span>
                <CreditCard className="w-4 h-4 text-[var(--primary)]" />
              </div>
              <div className="text-2xl font-bold text-[var(--text-heading)]">
                {formatCurrency(summary.totalClientRevenueNgn || 0)}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Total paid by End Users
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1.5">
                <span>Agent Task Pay Credited</span>
                <Wallet className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-[var(--primary)]">
                {formatCurrency(summary.totalAgentCreditedNgn || 0)}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Total credited to Operative Wallets
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1.5">
                <span>Net Platform Margin</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(summary.netPlatformMarginNgn || 0)}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Client Revenue minus Agent Task Pay
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1.5">
                <span>Agent Bank Withdrawals</span>
                <ArrowUpRight className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-[var(--text-heading)]">
                {formatCurrency(summary.totalBankWithdrawalsNgn || 0)}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Refunds: {formatCurrency(summary.totalRefundedNgn || 0)}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {[
              { id: "ledger", label: "1. Client Payments & Task Margin Ledger" },
              { id: "wallets", label: "2. Operative Wallets & Bank Withdrawals" },
              {
                id: "disputes",
                label: `3. Contested Deliverables (${data?.disputedTasks?.length || 0})`,
              },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer ${
                  activeTab === t.id
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-color)] hover:text-[var(--text-heading)]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* TAB 1: CLIENT PAYMENTS & TASK MARGIN LEDGER */}
          {activeTab === "ledger" && (
            <div className="overflow-x-auto rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs">
              <table className="w-full text-left text-xs text-[var(--text-body)]">
                <thead className="bg-[var(--bg-secondary)] text-[11px] uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-color)]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Reference / Task</th>
                    <th className="px-4 py-3 font-semibold">Client</th>
                    <th className="px-4 py-3 font-semibold">Operative</th>
                    <th className="px-4 py-3 font-semibold text-right">Client Paid</th>
                    <th className="px-4 py-3 font-semibold text-right">Agent Task Pay</th>
                    <th className="px-4 py-3 font-semibold text-right">Oversite Margin</th>
                    <th className="px-4 py-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {(data?.taskRevenueLedger || []).map((row: any) => (
                    <tr
                      key={row.taskId}
                      className="hover:bg-[var(--bg-secondary)]/60 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/tasks/${row.taskId}`}
                          className="font-bold text-[var(--text-heading)] hover:text-[var(--primary)]"
                        >
                          {row.taskTitle}
                        </Link>
                        <div className="text-[10px] font-mono text-[var(--text-muted)]">
                          {row.gatewayRef} · {row.moduleType}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-[var(--text-heading)]">
                        {row.clientName}
                      </td>
                      <td className="px-4 py-3">
                        {row.operativeCode ? (
                          <div>
                            <span className="font-mono font-bold text-[var(--primary)]">
                              {row.operativeCode}
                            </span>
                            {row.agentName && (
                              <span className="text-[11px] text-[var(--text-muted)] ml-1">
                                ({row.agentName})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[var(--text-muted)]">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-[var(--text-heading)]">
                        {formatCurrency(row.clientPaidNgn)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-[var(--primary)]">
                        {formatCurrency(row.agentPayoutNgn)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(row.platformMarginNgn)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                          {row.taskStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: OPERATIVE WALLETS & BANK WITHDRAWALS */}
          {activeTab === "wallets" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
                <h3 className="text-sm font-bold text-[var(--text-heading)]">
                  Operative Wallet Balances
                </h3>
                {(data?.agentWalletsLedger || []).length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">
                    No operative wallets credited yet.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {data.agentWalletsLedger.map((w: any) => (
                      <div
                        key={w.walletId}
                        className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[var(--primary)]">
                              {w.operativeCode}
                            </span>
                            <span className="font-bold text-[var(--text-heading)]">
                              {w.agentName}
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--text-muted)]">
                            Bank: {w.bankAccountName || "Not linked"} (
                            {w.bankAccountNumber || "—"})
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-[var(--text-heading)]">
                            {formatCurrency(w.balanceNgn)}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)]">
                            Earned: {formatCurrency(w.totalEarnedNgn)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
                <h3 className="text-sm font-bold text-[var(--text-heading)]">
                  Recent Operative Bank Withdrawals
                </h3>
                {(data?.payoutTransactionsLedger || []).length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">
                    No bank withdrawal transactions recorded yet.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {data.payoutTransactionsLedger.map((p: any) => (
                      <div
                        key={p.id}
                        className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[var(--primary)]">
                              {p.operativeCode}
                            </span>
                            <span className="font-bold text-[var(--text-heading)]">
                              {p.agentName}
                            </span>
                          </div>
                          <p className="text-[10px] font-mono text-[var(--text-muted)]">
                            {p.gatewayRef} · Acct: {p.accountNumber}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-[var(--text-heading)]">
                            {formatCurrency(p.amountNgn)}
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            {p.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CONTESTED DELIVERABLES & REFUND RESOLUTION */}
          {activeTab === "disputes" && (
            <div className="space-y-4">
              {(data?.disputedTasks || []).length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--text-muted)] rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                  No contested tasks. All deliverables are settled or in active execution.
                </div>
              ) : (
                data.disputedTasks.map((task: any) => (
                  <div
                    key={task.id}
                    className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                          CONTESTED TASK #{task.id.slice(0, 8)}
                        </span>
                        <span className="text-sm font-bold text-[var(--text-heading)]">
                          {task.title}
                        </span>
                      </div>
                      <div className="text-xs">
                        Client Paid:{" "}
                        <strong className="text-[var(--text-heading)]">
                          {formatCurrency(task.clientPriceNgn)}
                        </strong>{" "}
                        · Agent Task Pay:{" "}
                        <strong className="text-[var(--primary)]">
                          {formatCurrency(task.agentPayoutNgn)}
                        </strong>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-body)]">
                      <strong>Client Feedback:</strong> {task.userRejectionReason}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-color)] flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleResolveContested(task.id, "REMEDIATE")}
                        className="px-3.5 py-1.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-heading)] flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-[var(--primary)]" />
                        <span>Order Re-Inspection</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleResolveContested(task.id, "REFUND_CLIENT")}
                        className="px-3.5 py-1.5 rounded-xl bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold cursor-pointer"
                      >
                        Refund Client ({formatCurrency(task.clientPriceNgn)})
                      </button>

                      <button
                        type="button"
                        onClick={() => handleResolveContested(task.id, "CREDIT_AGENT")}
                        className="px-4 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>
                          Credit Operative ({formatCurrency(task.agentPayoutNgn)})
                        </span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
