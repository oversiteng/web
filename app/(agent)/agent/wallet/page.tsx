"use client";

import React, { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  ArrowLeft,
  ChevronDown,
  Trash2,
  Check,
  CheckCircle2,
  Building2,
  X,
} from "lucide-react";

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
}

const NIGERIAN_BANKS = [
  { code: "058", name: "Guaranty Trust Bank (GTB)" },
  { code: "057", name: "Zenith Bank" },
  { code: "011", name: "First Bank of Nigeria" },
  { code: "033", name: "United Bank for Africa (UBA)" },
  { code: "044", name: "Access Bank" },
  { code: "50211", name: "Kuda Microfinance Bank" },
  { code: "50515", name: "Moniepoint Microfinance Bank" },
  { code: "999992", name: "OPay Digital Services" },
];

const INITIAL_SAVED_ACCOUNTS: BankAccount[] = [
  {
    id: "acc-1",
    bankName: "Guarantee trust Bank (GTB)",
    accountNumber: "0234562291",
    accountName: "Tunde Coker",
    isDefault: true,
  },
];

interface RecentPayout {
  id: string;
  title: string;
  category: string;
  dateText: string;
  amountNgn: number;
  status: "PROCESSING" | "PAID";
}

const RECENT_PAYOUTS: RecentPayout[] = [
  {
    id: "pay-1",
    title: "CAC certified copy",
    category: "Document Processing",
    dateText: "today",
    amountNgn: 9500,
    status: "PROCESSING",
  },
  {
    id: "pay-2",
    title: "Surulere errand",
    category: "Quick errand",
    dateText: "Jun 16",
    amountNgn: 2500,
    status: "PAID",
  },
  {
    id: "pay-3",
    title: "VI vendor check",
    category: "Due Diligence",
    dateText: "Jun 16",
    amountNgn: 5000,
    status: "PAID",
  },
  {
    id: "pay-4",
    title: "Yaba CAC retrieval",
    category: "Document Processing",
    dateText: "Jun 14",
    amountNgn: 4500,
    status: "PAID",
  },
];

export default function AgentWalletPage() {
  // Navigation view: "earnings" | "withdraw" | "add-bank"
  const [currentView, setCurrentView] = useState<"earnings" | "withdraw" | "add-bank">("earnings");

  // Wallet balances
  const [balance, setBalance] = useState(31000);
  const pendingReview = 7500;
  const thisWeek = 9500;
  const thisMonth = 103500;

  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [selectedQuickChip, setSelectedQuickChip] = useState<string | null>(null);

  // Bank accounts state
  const [savedAccounts, setSavedAccounts] = useState<BankAccount[]>(INITIAL_SAVED_ACCOUNTS);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount>(INITIAL_SAVED_ACCOUNTS[0]);
  const [showSelectAccountModal, setShowSelectAccountModal] = useState(false);

  // Add bank form state
  const [selectedBankCode, setSelectedBankCode] = useState("");
  const [newAccountNumber, setNewAccountNumber] = useState("");
  const [isVerifyingAccount, setIsVerifyingAccount] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleChipClick = (label: string, value: number) => {
    setSelectedQuickChip(label);
    setWithdrawAmount(value.toString());
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(withdrawAmount);
    if (isNaN(num) || num <= 0) {
      showToast("Please enter a valid withdrawal amount.");
      return;
    }
    if (num > balance) {
      showToast("Amount exceeds your available balance.");
      return;
    }

    setBalance((prev) => Math.max(0, prev - num));
    showToast(`Withdrawal of ₦${num.toLocaleString()} initiated to ${selectedAccount.bankName}!`);
    setTimeout(() => {
      setWithdrawAmount("");
      setSelectedQuickChip(null);
      setCurrentView("earnings");
    }, 1200);
  };

  const handleDeleteAccount = (accId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (savedAccounts.length <= 1) {
      showToast("You must keep at least one payout bank account.");
      return;
    }
    const filtered = savedAccounts.filter((a) => a.id !== accId);
    setSavedAccounts(filtered);
    if (selectedAccount.id === accId) {
      setSelectedAccount(filtered[0]);
    }
    showToast("Bank account removed.");
  };

  const handleAddBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBankCode) {
      showToast("Please select your bank.");
      return;
    }
    if (newAccountNumber.length !== 10) {
      showToast("Please enter a valid 10-digit Nigerian account number.");
      return;
    }

    setIsVerifyingAccount(true);
    showToast("Verifying account with NIBSS...");

    setTimeout(() => {
      setIsVerifyingAccount(false);
      const bank = NIGERIAN_BANKS.find((b) => b.code === selectedBankCode);
      const newAcc: BankAccount = {
        id: `acc-${Date.now()}`,
        bankName: bank?.name || "Guaranty Trust Bank (GTB)",
        accountNumber: newAccountNumber,
        accountName: "Tunde Coker",
        isDefault: false,
      };

      setSavedAccounts((prev) => [...prev, newAcc]);
      setSelectedAccount(newAcc);
      showToast("Bank account verified and linked successfully!");
      setNewAccountNumber("");
      setSelectedBankCode("");
      setShowSelectAccountModal(false);
      setCurrentView("withdraw");
    }, 1000);
  };

  return (
    <div className="space-y-4 max-w-full pb-12">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[var(--bg-card)] text-[var(--text-heading)] border border-[var(--border-color)] font-semibold text-xs px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[var(--primary)] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =========================================================================
          VIEW 1: EARNINGS MAIN SCREEN
          ========================================================================= */}
      {currentView === "earnings" && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pt-1">
            <h1 className="text-2xl font-bold text-[var(--text-heading)] tracking-tight">Earnings</h1>
            <ThemeToggle className="w-9 h-9 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] flex items-center justify-center transition-colors shadow-xs cursor-pointer" />
          </div>

          {/* Balance Card */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-[24px] p-5 space-y-4 shadow-[0_0_10px_rgba(0,0,0,0.03)]">
            <div>
              <span className="text-xs text-[var(--text-muted)] font-medium block">Balance</span>
              <div className="text-4xl font-extrabold text-[var(--text-heading)] tracking-tight mt-1">
                ₦{balance.toLocaleString()}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                ₦{pendingReview.toLocaleString()} pending review
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCurrentView("withdraw")}
              className="w-full py-3.5 px-4 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-xs transition-all cursor-pointer text-center shadow-xs"
            >
              Withdraw
            </button>
          </div>

          {/* Period Stats Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-[20px] p-4 shadow-[0_0_10px_rgba(0,0,0,0.03)]">
              <div className="text-xl font-bold text-[var(--text-heading)]">
                ₦{thisWeek.toLocaleString()}
              </div>
              <span className="text-xs text-[var(--text-muted)] font-medium">This week</span>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-[20px] p-4 shadow-[0_0_10px_rgba(0,0,0,0.03)]">
              <div className="text-xl font-bold text-[var(--text-heading)]">
                ₦{thisMonth.toLocaleString()}
              </div>
              <span className="text-xs text-[var(--text-muted)] font-medium">This month</span>
            </div>
          </div>

          {/* Recent Payouts Section */}
          <div className="space-y-3 pt-1">
            <h2 className="text-base font-bold text-[var(--text-heading)]">Recent payouts</h2>

            <div className="space-y-2.5">
              {RECENT_PAYOUTS.map((payout) => {
                const isProcessing = payout.status === "PROCESSING";

                return (
                  <div
                    key={payout.id}
                    className="bg-[var(--bg-card)] border border-[var(--border-color)]/70 hover:border-[var(--primary-border)] rounded-[20px] p-4 flex items-center justify-between transition-all shadow-[0_0_10px_rgba(0,0,0,0.03)]"
                  >
                    <div>
                      <h3 className="text-[var(--text-heading)] font-bold text-sm leading-snug">
                        {payout.title}
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {payout.category} · {payout.dateText}
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="text-sm font-extrabold text-[var(--text-heading)]">
                        ₦{payout.amountNgn.toLocaleString()}
                      </div>
                      <div>
                        {isProcessing ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--warning-light)] border border-[var(--warning)]/30 text-[var(--warning)] text-[10px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--warning)]" />
                            Processing
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--primary-light)] border border-[var(--primary-border)] text-[var(--primary)] text-[10px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                            Paid
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: WITHDRAW SCREEN
          ========================================================================= */}
      {currentView === "withdraw" && (
        <form onSubmit={handleWithdrawSubmit} className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentView("earnings")}
                className="w-9 h-9 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] transition-colors shadow-xs cursor-pointer"
                aria-label="Back to earnings"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-xl font-bold text-[var(--text-heading)] tracking-tight">Withdraw</h1>
            </div>
            <ThemeToggle className="w-9 h-9 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] flex items-center justify-center transition-colors shadow-xs cursor-pointer" />
          </div>

          {/* Available Balance */}
          <div className="space-y-1">
            <span className="text-xs text-[var(--text-muted)] font-medium">Available balance</span>
            <div className="text-3xl font-extrabold text-[var(--text-heading)] tracking-tight">
              ₦{balance.toLocaleString()}
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-heading)] block">Amount</label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-[var(--text-muted)] font-bold text-base select-none">
                ₦
              </span>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => {
                  setWithdrawAmount(e.target.value);
                  setSelectedQuickChip(null);
                }}
                placeholder="0"
                min="100"
                max={balance}
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[var(--primary)] rounded-2xl pl-10 pr-4 py-3.5 text-base font-bold text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none transition-colors shadow-xs"
              />
            </div>
          </div>

          {/* Quick Preset Amount Chips */}
          <div className="flex items-center gap-2">
            {[
              { label: "All", value: balance },
              { label: "₦5k", value: 5000 },
              { label: "₦10k", value: 10000 },
              { label: "₦20k", value: 20000 },
            ].map(({ label, value }) => {
              const isSelected = selectedQuickChip === label;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleChipClick(label, value)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[var(--primary)] text-white shadow-xs"
                      : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-heading)] hover:border-[var(--primary-border)] shadow-xs"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Send To Card */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-semibold text-[var(--text-heading)] block">Send to</label>
            <div
              onClick={() => setShowSelectAccountModal(true)}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--primary-border)] rounded-2xl px-4 py-3.5 flex items-center justify-between text-xs text-[var(--text-heading)] cursor-pointer transition-colors shadow-xs"
            >
              <div className="flex items-center gap-2 truncate">
                <Building2 className="w-4 h-4 text-[var(--primary)] shrink-0" />
                <span className="font-medium truncate">
                  GTB •••• {selectedAccount.accountNumber.slice(-4)} ({selectedAccount.accountName})
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
            </div>
          </div>

          {/* Submit Withdraw Button */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm transition-all shadow-sm ${
                withdrawAmount && parseFloat(withdrawAmount) > 0
                  ? "bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white cursor-pointer"
                  : "bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-color)] cursor-not-allowed opacity-60"
              }`}
            >
              Withdraw
            </button>
          </div>
        </form>
      )}

      {/* =========================================================================
          VIEW 3: SELECT ACCOUNT BOTTOM SHEET
          ========================================================================= */}
      {showSelectAccountModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 dark:bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowSelectAccountModal(false)}
        >
          <div
            className="bg-[var(--bg-card)] border-t sm:border border-[var(--border-color)] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Bar */}
            <div className="w-12 h-1 bg-[var(--border-color)] rounded-full mx-auto sm:hidden" />

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[var(--text-heading)]">Select account</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Choose the account where you would like your money to be sent.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSelectAccountModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-heading)] p-1 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Saved Accounts List */}
            <div className="space-y-2.5 pt-1">
              {savedAccounts.map((account) => {
                const isSelected = selectedAccount.id === account.id;

                return (
                  <div
                    key={account.id}
                    onClick={() => {
                      setSelectedAccount(account);
                      setShowSelectAccountModal(false);
                      showToast(`Selected ${account.bankName}`);
                    }}
                    className={`rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? "border border-[var(--primary)] bg-[var(--primary-light)]/50 shadow-xs"
                        : "border border-[var(--border-color)] bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)] hover:border-[var(--primary-border)]"
                    }`}
                  >
                    <div>
                      <h3 className="text-[var(--text-heading)] font-bold text-xs leading-snug">
                        {account.bankName}
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {account.accountNumber} • {account.accountName}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteAccount(account.id, e)}
                        className="text-[var(--text-muted)] hover:text-[var(--danger)] p-1 cursor-pointer transition-colors"
                        title="Remove bank"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* "Add another bank" Link */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowSelectAccountModal(false);
                  setCurrentView("add-bank");
                }}
                className="text-xs font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] cursor-pointer py-2 transition-colors"
              >
                Add another bank
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 4: ADD BANK ACCOUNT SCREEN
          ========================================================================= */}
      {currentView === "add-bank" && (
        <form onSubmit={handleAddBankSubmit} className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentView("withdraw")}
                className="w-9 h-9 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] transition-colors shadow-xs cursor-pointer"
                aria-label="Back to withdraw"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-xl font-bold text-[var(--text-heading)] tracking-tight">Add bank account</h1>
            </div>
            <ThemeToggle className="w-9 h-9 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] flex items-center justify-center transition-colors shadow-xs cursor-pointer" />
          </div>

          {/* Bank Select Dropdown */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-heading)] block">Bank</label>
            <div className="relative">
              <select
                value={selectedBankCode}
                onChange={(e) => setSelectedBankCode(e.target.value)}
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[var(--primary)] rounded-2xl px-4 py-3.5 text-xs text-[var(--text-heading)] focus:outline-none appearance-none cursor-pointer transition-colors shadow-xs"
              >
                <option value="" disabled className="text-[var(--text-muted)]">
                  Select bank
                </option>
                {NIGERIAN_BANKS.map((b) => (
                  <option key={b.code} value={b.code} className="bg-[var(--bg-card)] text-[var(--text-heading)]">
                    {b.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[var(--text-muted)] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Account Number Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-heading)] block">Account number</label>
            <input
              type="text"
              maxLength={10}
              value={newAccountNumber}
              onChange={(e) => setNewAccountNumber(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter 10-digit account number"
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[var(--primary)] rounded-2xl px-4 py-3.5 text-xs text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none transition-colors shadow-xs"
            />
          </div>

          {/* Continue Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isVerifyingAccount || newAccountNumber.length !== 10 || !selectedBankCode}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm transition-all shadow-sm ${
                newAccountNumber.length === 10 && selectedBankCode
                  ? "bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white cursor-pointer"
                  : "bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-color)] cursor-not-allowed opacity-60"
              }`}
            >
              {isVerifyingAccount ? "Verifying..." : "Continue"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
