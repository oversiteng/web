"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  Trash2,
  Check,
  CheckCircle2,
  Plus,
  Clock,
  ArrowRight,
  Building2,
  X,
  CreditCard,
  ShieldCheck,
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
  // Navigation view: "earnings" (Image 2) | "withdraw" (Image 3) | "add-bank" (Image 5)
  const [currentView, setCurrentView] = useState<"earnings" | "withdraw" | "add-bank">("earnings");

  // Wallet balances
  const [balance, setBalance] = useState(31000);
  const pendingReview = 7500;
  const thisWeek = 9500;
  const thisMonth = 103500;

  // Withdraw state (Image 3)
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [selectedQuickChip, setSelectedQuickChip] = useState<string | null>(null);

  // Bank accounts state (Image 4 & 5)
  const [savedAccounts, setSavedAccounts] = useState<BankAccount[]>(INITIAL_SAVED_ACCOUNTS);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount>(INITIAL_SAVED_ACCOUNTS[0]);
  const [showSelectAccountModal, setShowSelectAccountModal] = useState(false);

  // Add bank form state (Image 5)
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
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =========================================================================
          VIEW 1: EARNINGS MAIN SCREEN (MATCHING IMAGE 2 EXACTLY)
          ========================================================================= */}
      {currentView === "earnings" && (
        <div className="space-y-6">
          {/* Header */}
          <div className="pt-1">
            <h1 className="text-2xl font-bold text-white tracking-tight">Earnings</h1>
          </div>

          {/* Balance Block matching Image 2 */}
          <div className="space-y-3">
            <div>
              <span className="text-xs text-slate-400 font-medium block">Balance</span>
              <div className="text-4xl font-extrabold text-white tracking-tight mt-1">
                ₦{balance.toLocaleString()}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                ₦{pendingReview.toLocaleString()} pending review
              </p>
            </div>

            {/* Withdraw Button matching Image 2 */}
            <button
              type="button"
              onClick={() => setCurrentView("withdraw")}
              className="w-full py-3.5 px-4 rounded-full border border-emerald-900/60 bg-[#0c1811] hover:bg-[#122419] text-emerald-400 font-bold text-xs transition-all cursor-pointer text-center shadow-xs"
            >
              Withdraw
            </button>
          </div>

          {/* Period Stats Row matching Image 2 (2 columns) */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <div className="text-xl font-bold text-white">
                ₦{thisWeek.toLocaleString()}
              </div>
              <span className="text-xs text-slate-400 font-medium">This week</span>
            </div>

            <div>
              <div className="text-xl font-bold text-white">
                ₦{thisMonth.toLocaleString()}
              </div>
              <span className="text-xs text-slate-400 font-medium">This month</span>
            </div>
          </div>

          {/* Recent Payouts Section matching Image 2 */}
          <div className="space-y-3 pt-2">
            <h2 className="text-base font-bold text-white">Recent payouts</h2>

            <div className="space-y-2">
              {RECENT_PAYOUTS.map((payout) => {
                const isProcessing = payout.status === "PROCESSING";

                return (
                  <div
                    key={payout.id}
                    className="bg-[#121c16] border border-[#1b2b20] hover:border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between transition-all"
                  >
                    <div>
                      <h3 className="text-white font-bold text-sm leading-snug">
                        {payout.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {payout.category} · {payout.dateText}
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="text-sm font-extrabold text-white">
                        ₦{payout.amountNgn.toLocaleString()}
                      </div>
                      <div>
                        {isProcessing ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#291e13] border border-amber-800/40 text-amber-400 text-[10px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Processing
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#102419] border border-emerald-800/40 text-emerald-400 text-[10px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
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
          VIEW 2: WITHDRAW SCREEN (MATCHING IMAGE 3 EXACTLY)
          ========================================================================= */}
      {currentView === "withdraw" && (
        <form onSubmit={handleWithdrawSubmit} className="space-y-5">
          {/* Header matching Image 3 */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setCurrentView("earnings")}
              className="w-9 h-9 rounded-full bg-[#121c16] border border-[#1b2b20] flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xl font-bold text-white tracking-tight">Withdraw</h1>
          </div>

          {/* Available Balance matching Image 3 */}
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">Available balance</span>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              ₦{balance.toLocaleString()}
            </div>
          </div>

          {/* Amount Input matching Image 3 */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">Amount</label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-slate-400 font-bold text-base select-none">
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
                className="w-full bg-[#151f18] border border-[#203427] focus:border-emerald-500 rounded-2xl pl-10 pr-4 py-3.5 text-base font-bold text-white placeholder-slate-600 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Quick Preset Amount Chips matching Image 3 */}
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
                      ? "bg-[#10b981] text-[#062414] font-bold shadow-xs"
                      : "bg-[#141e17] border border-[#1f3125] text-slate-300 hover:border-emerald-500/30"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Send To Card matching Image 3 */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-semibold text-slate-300 block">Send to</label>
            <div
              onClick={() => setShowSelectAccountModal(true)}
              className="bg-[#151f18] border border-[#203427] hover:border-emerald-500/40 rounded-2xl px-4 py-3.5 flex items-center justify-between text-xs text-slate-200 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2 truncate">
                <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium truncate">
                  GTB •••• {selectedAccount.accountNumber.slice(-4)} ({selectedAccount.accountName})
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
          </div>

          {/* Submit Withdraw Button matching Image 3 */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm transition-all cursor-pointer shadow-md ${
                withdrawAmount && parseFloat(withdrawAmount) > 0
                  ? "bg-[#10b981] hover:bg-[#059669] text-black"
                  : "bg-[#1f4a30] text-slate-400 cursor-not-allowed opacity-75"
              }`}
            >
              Withdraw
            </button>
          </div>
        </form>
      )}

      {/* =========================================================================
          VIEW 3: SELECT ACCOUNT BOTTOM SHEET (MATCHING IMAGE 4 EXACTLY)
          ========================================================================= */}
      {showSelectAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#0b130e] border-t sm:border border-[#1b2b20] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 animate-in slide-in-from-bottom duration-200">
            {/* Mobile Drag Bar */}
            <div className="w-12 h-1 bg-[#23382b] rounded-full mx-auto sm:hidden" />

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">Select account</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose the account where you would like your money to be sent.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSelectAccountModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Saved Accounts List matching Image 4 */}
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
                        ? "border border-emerald-500 bg-[#121c16] shadow-sm shadow-emerald-500/10"
                        : "border border-[#1f3125] bg-[#141e17] hover:border-emerald-500/30"
                    }`}
                  >
                    <div>
                      <h3 className="text-white font-bold text-xs leading-snug">
                        {account.bankName}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {account.accountNumber} • {account.accountName}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteAccount(account.id, e)}
                        className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                        title="Remove bank"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#10b981] text-black flex items-center justify-center font-bold">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* "Add another bank" Link matching Image 4 */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowSelectAccountModal(false);
                  setCurrentView("add-bank");
                }}
                className="text-xs font-semibold text-slate-300 hover:text-emerald-400 cursor-pointer py-2 transition-colors"
              >
                Add another bank
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 4: ADD BANK ACCOUNT SCREEN (MATCHING IMAGE 5 EXACTLY)
          ========================================================================= */}
      {currentView === "add-bank" && (
        <form onSubmit={handleAddBankSubmit} className="space-y-5">
          {/* Header matching Image 5 */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setCurrentView("withdraw")}
              className="w-9 h-9 rounded-full bg-[#121c16] border border-[#1b2b20] flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xl font-bold text-white tracking-tight">Add bank account</h1>
          </div>

          {/* Bank Select Dropdown matching Image 5 */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">Bank</label>
            <div className="relative">
              <select
                value={selectedBankCode}
                onChange={(e) => setSelectedBankCode(e.target.value)}
                className="w-full bg-[#151f18] border border-[#203427] focus:border-emerald-500 rounded-2xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none appearance-none cursor-pointer transition-colors"
              >
                <option value="" disabled className="text-slate-500">
                  Select bank
                </option>
                {NIGERIAN_BANKS.map((b) => (
                  <option key={b.code} value={b.code} className="bg-slate-900 text-white">
                    {b.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Account Number Input matching Image 5 */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">Account number</label>
            <input
              type="text"
              maxLength={10}
              value={newAccountNumber}
              onChange={(e) => setNewAccountNumber(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter 10-digit account number"
              className="w-full bg-[#151f18] border border-[#203427] focus:border-emerald-500 rounded-2xl px-4 py-3.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-colors"
            />
          </div>

          {/* Continue Button matching Image 5 */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isVerifyingAccount || newAccountNumber.length !== 10 || !selectedBankCode}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm transition-all cursor-pointer shadow-md ${
                newAccountNumber.length === 10 && selectedBankCode
                  ? "bg-[#10b981] hover:bg-[#059669] text-black"
                  : "bg-[#275c3c] text-slate-400 cursor-not-allowed opacity-75"
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
