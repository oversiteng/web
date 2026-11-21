"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AgentTopNav } from "@/components/agent/AgentTopNav";
import { EmptyState } from "@/components/ui/EmptyState";
import { ResponsiveSelect } from "@/components/ui/ResponsiveSelect";
import { useAuth } from "@/context/AuthContext";
import {
  ChevronDown,
  Trash2,
  Check,
  CheckCircle2,
  Building2,
  X,
  Info,
  Delete,
  Copy,
  Loader2,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

interface BankAccount {
  id: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
}

interface BankOption {
  code: string;
  name: string;
}

const DEFAULT_NIGERIAN_BANKS: BankOption[] = [
  { code: "058", name: "Guaranty Trust Bank (GTB)" },
  { code: "057", name: "Zenith Bank" },
  { code: "011", name: "First Bank of Nigeria" },
  { code: "033", name: "United Bank for Africa (UBA)" },
  { code: "044", name: "Access Bank" },
  { code: "50211", name: "Kuda Microfinance Bank" },
  { code: "50515", name: "Moniepoint Microfinance Bank" },
  { code: "999992", name: "OPay Digital Services" },
];

interface RecentPayout {
  id: string;
  title: string;
  category: string;
  dateText: string;
  amountNgn: number;
  status: "PROCESSING" | "PAID";
  reference?: string;
}

const INITIAL_RECENT_PAYOUTS: RecentPayout[] = [];

interface WithdrawalReceipt {
  amount: number;
  bankName: string;
  last4: string;
  reference: string;
  requestedAt: string;
}

const KEYPAD_KEYS = [
  { digit: "1", letters: "" },
  { digit: "2", letters: "ABC" },
  { digit: "3", letters: "DEF" },
  { digit: "4", letters: "GHI" },
  { digit: "5", letters: "JKL" },
  { digit: "6", letters: "MNO" },
  { digit: "7", letters: "PQRS" },
  { digit: "8", letters: "TUV" },
  { digit: "9", letters: "WXYZ" },
];

const MIN_WITHDRAWAL_NGN = 1000;
const TRANSFER_FEE_NGN = 0;

function formatRequestedTimestamp(date: Date): string {
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" });
  const hours = date.getHours().toString().padStart(2, "0");
  const mins = date.getMinutes().toString().padStart(2, "0");
  return `${day} ${month}, ${hours}:${mins}`;
}

export default function AgentWalletPage() {
  const { user } = useAuth();

  // Multi-step flow: "earnings" -> "withdraw" -> "review" -> ("setup-pin" ->) "confirm" -> "success" (+ "add-bank")
  const [currentView, setCurrentView] = useState<
    "earnings" | "withdraw" | "review" | "setup-pin" | "confirm" | "success" | "add-bank"
  >("earnings");

  // Wallet balances & recent payouts
  const [balance, setBalance] = useState(0);
  const [pendingReview, setPendingReview] = useState(0);
  const [isLiveWallet, setIsLiveWallet] = useState(false);
  const [thisWeek, setThisWeek] = useState(0);
  const [thisMonth, setThisMonth] = useState(0);
  const [recentPayouts, setRecentPayouts] = useState<RecentPayout[]>(INITIAL_RECENT_PAYOUTS);

  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [selectedQuickChip, setSelectedQuickChip] = useState<string | null>(null);

  // PIN setup & confirmation state
  const [hasWithdrawalPin, setHasWithdrawalPin] = useState(false);
  const [pinReturnView, setPinReturnView] = useState<"earnings" | "confirm">("earnings");
  const [verifiedCurrentPin, setVerifiedCurrentPin] = useState("");
  const [setupPinFirst, setSetupPinFirst] = useState("");
  const [pin, setPin] = useState<string>("");
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [withdrawalReceipt, setWithdrawalReceipt] = useState<WithdrawalReceipt | null>(null);

  // Bank accounts state
  const [banksList, setBanksList] = useState<BankOption[]>(DEFAULT_NIGERIAN_BANKS);
  const [savedAccounts, setSavedAccounts] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [showSelectAccountModal, setShowSelectAccountModal] = useState(false);

  // Add bank form state
  const [selectedBankCode, setSelectedBankCode] = useState("");
  const [newAccountNumber, setNewAccountNumber] = useState("");
  const [resolvedAccountName, setResolvedAccountName] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [isResolvingName, setIsResolvingName] = useState(false);
  const [isVerifyingAccount, setIsVerifyingAccount] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Load live wallet & bank directory when available
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Remove legacy unscoped PIN key so new signups never inherit another user's PIN state
      localStorage.removeItem("oversite_withdrawal_pin");
    }

    async function loadWalletAndBanks() {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const [walletRes, banksRes] = await Promise.all([
          fetch("/api/v1/agent/wallet", { credentials: "include", headers }).catch(() => null),
          fetch("/api/v1/banks", { credentials: "include", headers }).catch(() => null),
        ]);

        let loadedBanks = DEFAULT_NIGERIAN_BANKS;
        if (banksRes && banksRes.ok) {
          const banksJson = await banksRes.json();
          if (banksJson.success && Array.isArray(banksJson.data) && banksJson.data.length > 0) {
            loadedBanks = banksJson.data;
            setBanksList(banksJson.data);
          }
        }

        if (walletRes && walletRes.ok) {
          const walletJson = await walletRes.json();
          if (walletJson.success && walletJson.data) {
            const liveBal = Number(walletJson.data.balanceNgn ?? 0);
            const livePending = Number(walletJson.data.pendingClearanceNgn ?? 0);
            setBalance(liveBal);
            setPendingReview(livePending);
            setIsLiveWallet(true);
            if (walletJson.data.hasWithdrawalPin) {
              setHasWithdrawalPin(true);
            }
            if (walletJson.data.totalEarnedNgn !== undefined) {
              setThisMonth(Number(walletJson.data.thisMonthNgn ?? walletJson.data.totalEarnedNgn ?? 0));
              setThisWeek(Number(walletJson.data.thisWeekNgn ?? 0));
            }
            if (Array.isArray(walletJson.data.recentPayouts)) {
              setRecentPayouts(walletJson.data.recentPayouts);
            }
            if (walletJson.data.savedBank?.isConfigured) {
              const bankCode = walletJson.data.savedBank.bankCode;
              const matchedBank = loadedBanks.find((b) => b.code === bankCode);
              const liveAcc: BankAccount = {
                id: "acc-live-1",
                bankCode,
                bankName: matchedBank?.name || `Bank (${bankCode})`,
                accountNumber: walletJson.data.savedBank.bankAccountNumber,
                accountName:
                  walletJson.data.savedBank.bankAccountName ||
                  user?.name ||
                  user?.fullName ||
                  "Accredited Operative",
                isDefault: true,
              };
              setSavedAccounts([liveAcc]);
              setSelectedAccount(liveAcc);
            }
          }
        }
      } catch {
        // Non-blocking fallback
      }
    }

    loadWalletAndBanks();
  }, [user?.name, user?.fullName]);

  // Auto-resolve NUBAN account name when 10 digits + bank selected
  useEffect(() => {
    if (currentView !== "add-bank") return;
    if (!selectedBankCode || newAccountNumber.length !== 10) {
      setResolvedAccountName(null);
      setResolveError(null);
      return;
    }

    let cancelled = false;
    async function resolveName() {
      setIsResolvingName(true);
      setResolveError(null);
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/v1/banks/resolve", {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify({
            bankCode: selectedBankCode,
            accountNumber: newAccountNumber,
          }),
        });
        const json = await res.json();
        if (!cancelled) {
          if (res.ok && json.success && json.data?.accountName) {
            setResolvedAccountName(json.data.accountName);
          } else {
            setResolvedAccountName(null);
            setResolveError(
              json.error?.message || "Could not verify NUBAN account name for this bank."
            );
          }
        }
      } catch {
        if (!cancelled) {
          setResolvedAccountName(null);
          setResolveError("Network error while verifying NUBAN account.");
        }
      } finally {
        if (!cancelled) setIsResolvingName(false);
      }
    }

    resolveName();
    return () => {
      cancelled = true;
    };
  }, [currentView, selectedBankCode, newAccountNumber]);

  const numericAmount = parseInt(withdrawAmount.replace(/\D/g, ""), 10) || 0;
  const netReceiveAmount = Math.max(0, numericAmount - TRANSFER_FEE_NGN);
  const isAmountTooLow = withdrawAmount.length > 0 && numericAmount < MIN_WITHDRAWAL_NGN;
  const isAmountTooHigh = numericAmount > balance;
  const canContinueToReview =
    numericAmount >= MIN_WITHDRAWAL_NGN && numericAmount <= balance && Boolean(selectedAccount);

  const handleAmountChange = (rawValue: string) => {
    const digitsOnly = rawValue.replace(/\D/g, "");
    setWithdrawAmount(digitsOnly);
    setSelectedQuickChip(null);
  };

  const handleChipClick = (label: string, value: number) => {
    if (value > balance || value < MIN_WITHDRAWAL_NGN) return;
    setSelectedQuickChip(label);
    setWithdrawAmount(value.toString());
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount < MIN_WITHDRAWAL_NGN) {
      showToast(`Minimum withdrawal is ₦${MIN_WITHDRAWAL_NGN.toLocaleString()}.`);
      return;
    }
    if (numericAmount > balance) {
      showToast("Amount exceeds your available balance.");
      return;
    }
    setCurrentView("review");
  };

  const executeWithdrawal = useCallback(async () => {
    if (isSubmittingWithdrawal || !selectedAccount) return;
    const currentAccount = selectedAccount;
    setIsSubmittingWithdrawal(true);
    setPinError(null);

    const now = new Date();
    let reference = `OVS-WD-${Math.floor(10000 + Math.random() * 90000)}`;
    let updatedBalance = Math.max(0, balance - numericAmount);
    let requestedDate = now;

    if (isLiveWallet) {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/v1/agent/wallet/withdraw", {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify({
            amountNgn: numericAmount,
            bankCode: currentAccount.bankCode,
            accountNumber: currentAccount.accountNumber,
            pin,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          setPinError(json.error?.message || "Unable to process withdrawal. Please try again.");
          setPin("");
          setIsSubmittingWithdrawal(false);
          return;
        }
        if (json.data?.gatewayRef) reference = json.data.gatewayRef;
        if (typeof json.data?.newBalanceNgn === "number") {
          updatedBalance = json.data.newBalanceNgn;
        }
        if (json.data?.processedAt) {
          requestedDate = new Date(json.data.processedAt);
        }
      } catch {
        setPinError("Network error while authorizing payout. Please try again.");
        setPin("");
        setIsSubmittingWithdrawal(false);
        return;
      }
    }

    const last4 = currentAccount.accountNumber.slice(-4);
    const formattedTimestamp = formatRequestedTimestamp(requestedDate);

    setBalance(updatedBalance);
    setRecentPayouts((prev) => [
      {
        id: `pay-${Date.now()}`,
        title: `${currentAccount.bankName} •••• ${last4}`,
        category: "Bank Withdrawal",
        dateText: "just now",
        amountNgn: numericAmount,
        status: "PROCESSING",
        reference,
      },
      ...prev,
    ]);
    setWithdrawalReceipt({
      amount: numericAmount,
      bankName: currentAccount.bankName,
      last4,
      reference,
      requestedAt: formattedTimestamp,
    });
    setIsSubmittingWithdrawal(false);
    setPin("");
    setCurrentView("success");
  }, [balance, isLiveWallet, isSubmittingWithdrawal, numericAmount, pin, selectedAccount]);

  const handlePinDigit = useCallback(
    (digit: string) => {
      if (isSubmittingWithdrawal || isSavingPin) return;
      setPinError(null);
      setPin((prev) => {
        if (prev.length >= 4) return prev;
        return prev + digit;
      });
    },
    [isSubmittingWithdrawal, isSavingPin]
  );

  const handlePinBackspace = useCallback(() => {
    if (isSubmittingWithdrawal || isSavingPin) return;
    setPinError(null);
    setPin((prev) => prev.slice(0, -1));
  }, [isSubmittingWithdrawal, isSavingPin]);

  // Handle 4 digits entered in Setup/Change PIN view (Requires Current PIN first if hasWithdrawalPin is true)
  useEffect(() => {
    if (currentView !== "setup-pin" || pin.length !== 4 || isSavingPin) return;

    // Step 0: If user already has a PIN and hasn't verified current PIN yet, verify current PIN first!
    if (hasWithdrawalPin && !verifiedCurrentPin) {
      const candidateCurrent = pin;
      setIsSavingPin(true);
      (async () => {
        try {
          const token =
            typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
          const res = await fetch("/api/v1/agent/wallet/pin", {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ currentPin: candidateCurrent, verifyOnly: true }),
          });
          const json = await res.json();
          if (res.ok && json.success) {
            setVerifiedCurrentPin(candidateCurrent);
            setPin("");
            setPinError(null);
          } else {
            setPinError(json.error?.message || "Incorrect current PIN. Please try again.");
            setPin("");
          }
        } catch {
          setPinError("Network error verifying current PIN.");
          setPin("");
        } finally {
          setIsSavingPin(false);
        }
      })();
      return;
    }

    if (!setupPinFirst) {
      if (hasWithdrawalPin && pin === verifiedCurrentPin) {
        setPinError("New PIN must be different from your current PIN.");
        setPin("");
        return;
      }
      // First entry of new PIN done; prompt to confirm
      setSetupPinFirst(pin);
      setPin("");
      return;
    }

    if (pin !== setupPinFirst) {
      setPinError("PINs did not match. Please enter a new 4-digit PIN.");
      setSetupPinFirst("");
      setPin("");
      return;
    }

    // Both entries match — save PIN to backend
    async function savePin() {
      setIsSavingPin(true);
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
        const res = await fetch("/api/v1/agent/wallet/pin", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            pin,
            currentPin: hasWithdrawalPin ? verifiedCurrentPin : undefined,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          setPinError(json?.error?.message || "Could not update withdrawal PIN.");
          setSetupPinFirst("");
          setPin("");
          return;
        }
        setHasWithdrawalPin(true);
        setVerifiedCurrentPin("");
        setSetupPinFirst("");
        setPin("");
        showToast("4-digit withdrawal PIN configured!");
        setCurrentView(pinReturnView);
      } catch {
        setPinError("Network error saving PIN.");
        setPin("");
      } finally {
        setIsSavingPin(false);
      }
    }

    savePin();
  }, [currentView, pin, setupPinFirst, hasWithdrawalPin, verifiedCurrentPin, isSavingPin, pinReturnView, showToast]);

  // Auto-submit once 4 PIN digits are entered on Confirm view
  useEffect(() => {
    if (currentView === "confirm" && pin.length === 4 && !isSubmittingWithdrawal) {
      executeWithdrawal();
    }
  }, [currentView, pin, isSubmittingWithdrawal, executeWithdrawal]);

  // Physical keyboard support on Confirm & Setup PIN views
  useEffect(() => {
    if (currentView !== "confirm" && currentView !== "setup-pin") return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handlePinDigit(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handlePinBackspace();
      } else if (e.key === "Escape") {
        e.preventDefault();
        setPin("");
        setSetupPinFirst("");
        setCurrentView(currentView === "setup-pin" ? pinReturnView : "review");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentView, pinReturnView, handlePinDigit, handlePinBackspace]);

  const handleFinishSuccess = () => {
    setWithdrawAmount("");
    setSelectedQuickChip(null);
    setPin("");
    setPinError(null);
    setWithdrawalReceipt(null);
    setCurrentView("earnings");
  };

  const handleDeleteAccount = (accId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (savedAccounts.length <= 1) {
      showToast("You must keep at least one payout bank account.");
      return;
    }
    const filtered = savedAccounts.filter((a) => a.id !== accId);
    setSavedAccounts(filtered);
    if (selectedAccount?.id === accId) {
      setSelectedAccount(filtered[0]);
    }
    showToast("Bank account removed.");
  };

  const handleAddBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBankCode) {
      showToast("Please select your bank.");
      return;
    }
    if (newAccountNumber.length !== 10 || !resolvedAccountName) {
      showToast("Please wait for your 10-digit NUBAN account name to resolve.");
      return;
    }

    setIsVerifyingAccount(true);
    const bank = banksList.find((b) => b.code === selectedBankCode);
    const accountHolderName = resolvedAccountName;

    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch("/api/v1/agent/bank-accounts", {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({
          bankCode: selectedBankCode,
          bankAccountNumber: newAccountNumber,
          bankAccountName: accountHolderName,
        }),
      });
    } catch {
      // Non-blocking fallback
    }

    const newAcc: BankAccount = {
      id: `acc-${Date.now()}`,
      bankCode: selectedBankCode,
      bankName: bank?.name || `Bank (${selectedBankCode})`,
      accountNumber: newAccountNumber,
      accountName: accountHolderName,
      isDefault: false,
    };

    setIsVerifyingAccount(false);
    setSavedAccounts((prev) => [...prev, newAcc]);
    setSelectedAccount(newAcc);
    showToast("Bank account verified and linked successfully!");
    setNewAccountNumber("");
    setSelectedBankCode("");
    setResolvedAccountName(null);
    setShowSelectAccountModal(false);
    setCurrentView("withdraw");
  };

  const handleCopyReference = async (ref: string) => {
    try {
      await navigator.clipboard.writeText(ref);
      showToast("Reference copied to clipboard");
    } catch {
      showToast(`Reference: ${ref}`);
    }
  };

  return (
    <div className="space-y-4 max-w-full pb-12">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-[var(--bg-card)] text-[var(--text-heading)] border border-[var(--border-color)] font-semibold text-xs px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[var(--primary)] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =========================================================================
          VIEW 1: EARNINGS MAIN SCREEN
          ========================================================================= */}
      {currentView === "earnings" && (
        <div className="space-y-6">
          <AgentTopNav
            title="Earnings"
            subtitle="Operative wallet balance, bank payouts & transaction history"
          />

          {/* Balance Card */}
          <div className="bg-[var(--bg-card)] rounded-md p-5 space-y-4 shadow-[0_0_10px_rgba(0,0,0,0.03)]">
            <div className="flex items-start justify-between gap-3">
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
                onClick={() => {
                  setPin("");
                  setVerifiedCurrentPin("");
                  setSetupPinFirst("");
                  setPinError(null);
                  setPinReturnView("earnings");
                  setCurrentView("setup-pin");
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--primary-light)] border border-[var(--border-color)] text-[11px] font-semibold text-[var(--text-heading)] hover:text-[var(--primary)] transition-colors cursor-pointer shrink-0"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span>{hasWithdrawalPin ? "Change PIN" : "Set Withdrawal PIN"}</span>
              </button>
            </div>

            <button
              type="button"
              disabled={balance < MIN_WITHDRAWAL_NGN}
              onClick={() => setCurrentView("withdraw")}
              className={`w-full py-3.5 px-4 rounded-lg font-bold text-xs transition-all text-center shadow-xs ${
                balance >= MIN_WITHDRAWAL_NGN
                  ? "bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white cursor-pointer"
                  : "bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)] text-[var(--text-muted)] border border-[var(--border-color)] cursor-not-allowed opacity-70"
              }`}
            >
              {balance >= MIN_WITHDRAWAL_NGN ? "Withdraw" : "Minimum ₦1,000 required to withdraw"}
            </button>
          </div>

          {/* Payout Bank Account Card — Always Accessible Even With ₦0 Balance */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 flex items-center justify-between gap-3 shadow-[0_0_10px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-[var(--text-heading)] block truncate">
                  {selectedAccount
                    ? `${selectedAccount.bankName} •••• ${selectedAccount.accountNumber.slice(-4)}`
                    : "Payout Bank Account"}
                </span>
                <span className="text-[11px] text-[var(--text-muted)] block truncate mt-0.5">
                  {selectedAccount
                    ? selectedAccount.accountName
                    : "No NUBAN payout account linked yet"}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                savedAccounts.length > 0
                  ? setShowSelectAccountModal(true)
                  : setCurrentView("add-bank")
              }
              className="px-3.5 py-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--primary-light)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-heading)] hover:text-[var(--primary)] transition-colors cursor-pointer shrink-0"
            >
              {selectedAccount ? "Manage Bank" : "Add Bank Account"}
            </button>
          </div>

          {/* Period Stats Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[var(--bg-card)] rounded-md p-4 shadow-[0_0_10px_rgba(0,0,0,0.03)]">
              <div className="text-xl font-bold text-[var(--text-heading)]">
                ₦{thisWeek.toLocaleString()}
              </div>
              <span className="text-xs text-[var(--text-muted)] font-medium">This week</span>
            </div>

            <div className="bg-[var(--bg-card)] rounded-md p-4 shadow-[0_0_10px_rgba(0,0,0,0.03)]">
              <div className="text-xl font-bold text-[var(--text-heading)]">
                ₦{thisMonth.toLocaleString()}
              </div>
              <span className="text-xs text-[var(--text-muted)] font-medium">This month</span>
            </div>
          </div>

          {/* Recent Payouts Section */}
          <div className="space-y-3 pt-1">
            <h2 className="text-base font-bold text-[var(--text-heading)]">Recent payouts</h2>

            {recentPayouts.length === 0 ? (
              <EmptyState
                preset="payouts"
                title="No payouts yet"
                description="Your completed task disbursements and withdrawal transactions will appear here."
              />
            ) : (
              <div className="space-y-2.5">
                {recentPayouts.map((payout) => {
                  const isProcessing = payout.status === "PROCESSING";

                  return (
                    <div
                      key={payout.id}
                      className="bg-[var(--bg-card)] hover:border-[var(--primary-border)] rounded-md p-4 flex items-center justify-between gap-3 transition-all shadow-[0_0_10px_rgba(0,0,0,0.03)]"
                    >
                      <div className="min-w-0">
                        <h3 className="text-[var(--text-heading)] font-bold text-sm leading-snug truncate">
                          {payout.title}
                        </h3>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                          {payout.category} · {payout.dateText}
                          {payout.reference ? ` · ${payout.reference}` : ""}
                        </p>
                      </div>

                      <div className="text-right space-y-1 shrink-0">
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
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: WITHDRAW AMOUNT & ACCOUNT SCREEN
          ========================================================================= */}
      {currentView === "withdraw" && (
        <form onSubmit={handleProceedToReview} className="space-y-5">
          <AgentTopNav
            showBack={true}
            onBack={() => setCurrentView("earnings")}
            title="Withdraw"
            subtitle="Transfer earnings to verified Nigerian bank account"
          />

          <div className="space-y-1">
            <span className="text-xs text-[var(--text-muted)] font-medium">Available balance</span>
            <div className="text-3xl font-extrabold text-[var(--text-heading)] tracking-tight">
              ₦{balance.toLocaleString()}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-heading)] block">Amount</label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-[var(--text-muted)] font-bold text-base select-none">
                ₦
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={withdrawAmount ? numericAmount.toLocaleString() : ""}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0"
                className={`w-full bg-[var(--bg-card)] border rounded-2xl pl-10 pr-4 py-3.5 text-base font-bold text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none transition-colors shadow-xs ${
                  isAmountTooLow || isAmountTooHigh
                    ? "border-[var(--danger)] focus:border-[var(--danger)]"
                    : "border-[var(--border-color)] focus:border-[var(--primary)]"
                }`}
              />
            </div>

            {isAmountTooHigh ? (
              <p className="text-xs text-[var(--danger)] font-medium">
                Amount exceeds your available balance (₦{balance.toLocaleString()}).
              </p>
            ) : isAmountTooLow ? (
              <p className="text-xs text-[var(--danger)] font-medium">
                Minimum withdrawal amount is ₦{MIN_WITHDRAWAL_NGN.toLocaleString()}.
              </p>
            ) : (
              <p className="text-[11px] text-[var(--text-muted)]">
                Minimum withdrawal: ₦{MIN_WITHDRAWAL_NGN.toLocaleString()} · Zero transfer fee
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {[
              { label: "All", value: balance },
              { label: "₦5k", value: 5000 },
              { label: "₦10k", value: 10000 },
              { label: "₦20k", value: 20000 },
            ].map(({ label, value }) => {
              const isDisabled = value > balance || value < MIN_WITHDRAWAL_NGN;
              const isSelected =
                selectedQuickChip === label ||
                (!selectedQuickChip && numericAmount > 0 && numericAmount === value);
              return (
                <button
                  key={label}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleChipClick(label, value)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                    isDisabled
                      ? "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] opacity-45 cursor-not-allowed"
                      : isSelected
                      ? "bg-[var(--primary)] text-white shadow-xs cursor-pointer"
                      : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-heading)] hover:border-[var(--primary-border)] shadow-xs cursor-pointer"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="space-y-2 pt-1">
            <label className="text-xs font-semibold text-[var(--text-heading)] block">Send to</label>
            <button
              type="button"
              onClick={() =>
                savedAccounts.length > 0
                  ? setShowSelectAccountModal(true)
                  : setCurrentView("add-bank")
              }
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--primary-border)] rounded-2xl px-4 py-3.5 flex items-center justify-between text-xs text-[var(--text-heading)] cursor-pointer transition-colors shadow-xs text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Building2 className="w-4 h-4 text-[var(--primary)] shrink-0" />
                <span className="font-medium truncate">
                  {selectedAccount
                    ? `${selectedAccount.bankName} •••• ${selectedAccount.accountNumber.slice(-4)} (${selectedAccount.accountName})`
                    : "Add a verified Nigerian bank account"}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-[var(--text-muted)] shrink-0 ml-2" />
            </button>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={!canContinueToReview}
              className={`w-full py-3.5 px-6 rounded-full font-bold text-sm transition-all shadow-sm ${
                canContinueToReview
                  ? "bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white cursor-pointer"
                  : "bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-color)] cursor-not-allowed opacity-60"
              }`}
            >
              Continue
            </button>
          </div>
        </form>
      )}

      {/* =========================================================================
          VIEW 3: REVIEW WITHDRAW SCREEN
          ========================================================================= */}
      {currentView === "review" && (
        <div className="space-y-5 min-h-[calc(100dvh-180px)] flex flex-col justify-between">
          <div className="space-y-5">
            <AgentTopNav
              showBack={true}
              onBack={() => setCurrentView("withdraw")}
              title="Review withdraw"
              hideRightControls={true}
            />

            <div className="bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-[24px] p-5 space-y-4 shadow-[0_0_10px_rgba(0,0,0,0.03)] text-[13px]">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--text-muted)] font-medium">Withdrawal amount</span>
                <span className="font-bold text-[var(--text-heading)]">
                  ₦{numericAmount.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--text-muted)] font-medium">Bank name</span>
                <span className="font-bold text-[var(--text-heading)] text-right">
                  {selectedAccount?.bankName || "—"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--text-muted)] font-medium">Account number</span>
                <span className="font-bold text-[var(--text-heading)]">
                  {selectedAccount?.accountNumber || "—"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--text-muted)] font-medium">Account name</span>
                <span className="font-bold text-[var(--text-heading)] text-right">
                  {selectedAccount?.accountName || "—"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--text-muted)] font-medium">Transfer fee</span>
                <span className="font-bold text-[var(--text-heading)]">
                  ₦{TRANSFER_FEE_NGN.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 pt-3 border-t border-[var(--border-color)]">
                <span className="text-[var(--text-muted)] font-medium">You&apos;ll receive</span>
                <span className="font-extrabold text-[var(--text-heading)] text-sm">
                  ₦{netReceiveAmount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-[var(--info-light)] border border-[var(--info)]/25 rounded-[22px] p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-[var(--info)] shrink-0 mt-0.5" />
              <p className="text-xs text-[var(--info)] leading-relaxed font-medium">
                Transfers to Nigerian banks usually land within hours, and always within 1 business day. You&apos;ll get a WhatsApp confirmation.
              </p>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="button"
              onClick={() => {
                setPin("");
                setSetupPinFirst("");
                setPinError(null);
                if (!hasWithdrawalPin) {
                  setPinReturnView("confirm");
                  setCurrentView("setup-pin");
                } else {
                  setCurrentView("confirm");
                }
              }}
              className="w-full py-3.5 px-6 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-sm transition-all shadow-sm cursor-pointer"
            >
              Withdraw ₦{numericAmount.toLocaleString()}
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 3B: SETUP 4-DIGIT WITHDRAWAL PIN SCREEN
          ========================================================================= */}
      {currentView === "setup-pin" && (
        <div className="min-h-[calc(100dvh-170px)] flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <AgentTopNav
              showBack={true}
              onBack={() => {
                setPin("");
                setVerifiedCurrentPin("");
                setSetupPinFirst("");
                setPinError(null);
                setCurrentView(pinReturnView === "confirm" ? "review" : "earnings");
              }}
              title={
                hasWithdrawalPin && !verifiedCurrentPin
                  ? "Enter current PIN"
                  : setupPinFirst
                  ? "Confirm your 4-digit PIN"
                  : hasWithdrawalPin
                  ? "Enter new withdrawal PIN"
                  : "Create withdrawal PIN"
              }
              hideRightControls={true}
            />

            <div className="bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-xl p-5 space-y-2 text-center shadow-[0_0_10px_rgba(0,0,0,0.03)]">
              <div className="w-10 h-10 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mx-auto">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-[var(--text-heading)]">
                {hasWithdrawalPin && !verifiedCurrentPin
                  ? "Verify your current 4-digit PIN"
                  : setupPinFirst
                  ? "Re-enter your 4-digit PIN to confirm"
                  : hasWithdrawalPin
                  ? "Choose your new 4-digit PIN"
                  : "Protect your operative payouts"}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {hasWithdrawalPin && !verifiedCurrentPin
                  ? "Enter your current 4-digit PIN before setting a new one."
                  : setupPinFirst
                  ? "Enter the same 4 digits one more time."
                  : "Choose a 4-digit security PIN required whenever you withdraw funds."}
              </p>
            </div>

            <div className="py-6 flex flex-col items-center justify-center space-y-3 min-h-[80px]">
              <div className="flex items-center justify-center gap-3.5 min-h-[16px]">
                {[0, 1, 2, 3].map((index) => {
                  const isFilled = index < pin.length;
                  return (
                    <span
                      key={index}
                      className={`rounded-full transition-all duration-150 ${
                        isFilled
                          ? "w-3.5 h-3.5 bg-[var(--primary)] scale-110 shadow-xs"
                          : "w-3.5 h-3.5 border-2 border-[var(--border-color)] bg-transparent"
                      }`}
                    />
                  );
                })}
              </div>

              {isSavingPin && (
                <div className="flex items-center gap-2 text-xs text-[var(--primary)] font-semibold pt-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving security PIN...</span>
                </div>
              )}

              {pinError && (
                <p className="text-xs text-[var(--danger)] font-medium text-center max-w-xs">
                  {pinError}
                </p>
              )}
            </div>
          </div>

          <div className="bg-[var(--bg-secondary)] dark:bg-[var(--bg-card)]/60 border border-[var(--border-color)]/70 rounded-[24px] p-2.5 sm:p-3">
            <div className="grid grid-cols-3 gap-2">
              {KEYPAD_KEYS.map(({ digit, letters }) => (
                <button
                  key={digit}
                  type="button"
                  disabled={isSavingPin}
                  onClick={() => handlePinDigit(digit)}
                  className="bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] active:scale-95 border border-[var(--border-color)]/60 rounded-xl py-2.5 sm:py-3 flex flex-col items-center justify-center shadow-2xs transition-all cursor-pointer select-none disabled:opacity-50"
                >
                  <span className="text-lg font-bold text-[var(--text-heading)] leading-none">
                    {digit}
                  </span>
                  {letters ? (
                    <span className="text-[9px] font-semibold text-[var(--text-muted)] tracking-widest mt-1 leading-none">
                      {letters}
                    </span>
                  ) : (
                    <span className="text-[9px] mt-1 leading-none opacity-0">.</span>
                  )}
                </button>
              ))}

              <div
                aria-hidden="true"
                className="rounded-xl py-2.5 sm:py-3 flex items-center justify-center text-xs font-semibold text-[var(--text-muted)]/60 select-none"
              >
                + * #
              </div>

              <button
                type="button"
                disabled={isSavingPin}
                onClick={() => handlePinDigit("0")}
                className="bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] active:scale-95 border border-[var(--border-color)]/60 rounded-xl py-2.5 sm:py-3 flex items-center justify-center shadow-2xs transition-all cursor-pointer select-none disabled:opacity-50"
              >
                <span className="text-lg font-bold text-[var(--text-heading)] leading-none">0</span>
              </button>

              <button
                type="button"
                disabled={isSavingPin || pin.length === 0}
                onClick={handlePinBackspace}
                aria-label="Delete digit"
                className="rounded-xl py-2.5 sm:py-3 flex items-center justify-center text-[var(--text-heading)] hover:bg-[var(--bg-card)] active:scale-95 transition-all cursor-pointer disabled:opacity-35"
              >
                <Delete className="w-5 h-5 stroke-[1.8]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 4: CONFIRM WITHDRAWAL PIN SCREEN
          ========================================================================= */}
      {currentView === "confirm" && (
        <div className="min-h-[calc(100dvh-170px)] flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <AgentTopNav
              showBack={true}
              onBack={() => {
                setPin("");
                setPinError(null);
                setCurrentView("review");
              }}
              title="Confirm withdrawal"
              hideRightControls={true}
            />

            <div className="bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-[24px] p-5 space-y-3.5 shadow-[0_0_10px_rgba(0,0,0,0.03)] text-[13px]">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--text-muted)] font-medium">Withdrawal amount</span>
                <span className="font-bold text-[var(--text-heading)]">
                  ₦{numericAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--text-muted)] font-medium">To</span>
                <span className="font-bold text-[var(--text-heading)] text-right">
                  {selectedAccount ? `${selectedAccount.bankName} •••• ${selectedAccount.accountNumber.slice(-4)}` : "—"}
                </span>
              </div>
            </div>

            <div className="py-6 flex flex-col items-center justify-center space-y-3 min-h-[80px]">
              <p className="text-xs text-[var(--text-muted)] font-medium">
                Enter your 4-digit security PIN
              </p>
              <div className="flex items-center justify-center gap-3.5 min-h-[16px]">
                {[0, 1, 2, 3].map((index) => {
                  const isFilled = index < pin.length;
                  return (
                    <span
                      key={index}
                      className={`rounded-full transition-all duration-150 ${
                        isFilled
                          ? "w-3.5 h-3.5 bg-[var(--primary)] scale-110 shadow-xs"
                          : "w-3.5 h-3.5 border-2 border-[var(--border-color)] bg-transparent"
                      }`}
                    />
                  );
                })}
              </div>

              {isSubmittingWithdrawal && (
                <div className="flex items-center gap-2 text-xs text-[var(--primary)] font-semibold pt-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Authorizing withdrawal...</span>
                </div>
              )}

              {pinError && (
                <p className="text-xs text-[var(--danger)] font-medium text-center max-w-xs">
                  {pinError}
                </p>
              )}
            </div>
          </div>

          <div className="bg-[var(--bg-secondary)] dark:bg-[var(--bg-card)]/60 border border-[var(--border-color)]/70 rounded-[24px] p-2.5 sm:p-3">
            <div className="grid grid-cols-3 gap-2">
              {KEYPAD_KEYS.map(({ digit, letters }) => (
                <button
                  key={digit}
                  type="button"
                  disabled={isSubmittingWithdrawal}
                  onClick={() => handlePinDigit(digit)}
                  className="bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] active:scale-95 border border-[var(--border-color)]/60 rounded-xl py-2.5 sm:py-3 flex flex-col items-center justify-center shadow-2xs transition-all cursor-pointer select-none disabled:opacity-50"
                >
                  <span className="text-lg font-bold text-[var(--text-heading)] leading-none">
                    {digit}
                  </span>
                  {letters ? (
                    <span className="text-[9px] font-semibold text-[var(--text-muted)] tracking-widest mt-1 leading-none">
                      {letters}
                    </span>
                  ) : (
                    <span className="text-[9px] mt-1 leading-none opacity-0">.</span>
                  )}
                </button>
              ))}

              <div
                aria-hidden="true"
                className="rounded-xl py-2.5 sm:py-3 flex items-center justify-center text-xs font-semibold text-[var(--text-muted)]/60 select-none"
              >
                + * #
              </div>

              <button
                type="button"
                disabled={isSubmittingWithdrawal}
                onClick={() => handlePinDigit("0")}
                className="bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] active:scale-95 border border-[var(--border-color)]/60 rounded-xl py-2.5 sm:py-3 flex items-center justify-center shadow-2xs transition-all cursor-pointer select-none disabled:opacity-50"
              >
                <span className="text-lg font-bold text-[var(--text-heading)] leading-none">0</span>
              </button>

              <button
                type="button"
                disabled={isSubmittingWithdrawal || pin.length === 0}
                onClick={handlePinBackspace}
                aria-label="Delete digit"
                className="rounded-xl py-2.5 sm:py-3 flex items-center justify-center text-[var(--text-heading)] hover:bg-[var(--bg-card)] active:scale-95 transition-all cursor-pointer disabled:opacity-35"
              >
                <Delete className="w-5 h-5 stroke-[1.8]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 5: SUCCESS SCREEN
          ========================================================================= */}
      {currentView === "success" && withdrawalReceipt && (
        <div className="min-h-[calc(100dvh-180px)] flex flex-col justify-between pt-12 pb-2">
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 rounded-full border-2 border-[var(--primary)] flex items-center justify-center mx-auto text-[var(--primary)]">
              <Check className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <h1 className="text-lg font-bold text-[var(--text-heading)]">
                Withdrawal on its way
              </h1>
              <div className="text-3xl sm:text-4xl font-extrabold text-[var(--text-heading)] tracking-tight">
                ₦{withdrawalReceipt.amount.toLocaleString()}
              </div>
              <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto leading-relaxed">
                Sent to {withdrawalReceipt.bankName} •••• {withdrawalReceipt.last4}. Most transfers land within a few hours.
              </p>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-[24px] p-5 space-y-3.5 shadow-[0_0_10px_rgba(0,0,0,0.03)] text-[13px] text-left">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--text-muted)] font-medium">Reference</span>
                <button
                  type="button"
                  onClick={() => handleCopyReference(withdrawalReceipt.reference)}
                  className="inline-flex items-center gap-1.5 font-bold text-[var(--text-heading)] hover:text-[var(--primary)] transition-colors cursor-pointer"
                  title="Copy reference"
                >
                  <span>{withdrawalReceipt.reference}</span>
                  <Copy className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                </button>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--text-muted)] font-medium">Requested</span>
                <span className="font-bold text-[var(--text-heading)]">
                  {withdrawalReceipt.requestedAt}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-8">
            <button
              type="button"
              onClick={handleFinishSuccess}
              className="w-full py-3.5 px-6 rounded-full border border-[var(--primary)]/50 hover:border-[var(--primary)] text-[var(--primary)] bg-transparent hover:bg-[var(--primary-light)]/20 font-bold text-sm transition-all cursor-pointer shadow-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: SELECT ACCOUNT BOTTOM SHEET
          ========================================================================= */}
      {showSelectAccountModal && (
        <div
          className="fixed inset-0 z-[80] bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowSelectAccountModal(false)}
        >
          <div
            className="bg-[var(--bg-card)] border-t sm:border border-[var(--border-color)] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 pb-8 sm:pb-6 max-w-md w-full space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
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

            <div className="space-y-2.5 pt-1">
              {savedAccounts.map((account) => {
                const isSelected = selectedAccount?.id === account.id;

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
                        {account.accountNumber} · {account.accountName}
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
          VIEW 6: ADD BANK ACCOUNT SCREEN
          ========================================================================= */}
      {currentView === "add-bank" && (
        <form onSubmit={handleAddBankSubmit} className="space-y-5">
          <AgentTopNav
            showBack={true}
            onBack={() => setCurrentView(savedAccounts.length > 0 ? "withdraw" : "earnings")}
            title="Add Bank Account"
            subtitle="Link verified NUBAN account for instant disbursements"
          />

          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-heading)] block">Bank</label>
            <ResponsiveSelect
              value={selectedBankCode}
              onChange={setSelectedBankCode}
              options={banksList.map((b) => ({ value: b.code, label: b.name }))}
              placeholder="Select bank"
              modalTitle="Select Nigerian Bank"
              searchable={true}
              searchPlaceholder="Search bank name..."
              triggerClassName="py-3.5 px-4 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-heading)] block">Account number</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              value={newAccountNumber}
              onChange={(e) => setNewAccountNumber(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter 10-digit account number"
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[var(--primary)] rounded-2xl px-4 py-3.5 text-xs text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none transition-colors shadow-xs"
            />

            {isResolvingName && (
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] px-1 pt-0.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--primary)]" />
                <span>Verifying NUBAN account holder via Paystack...</span>
              </div>
            )}

            {!isResolvingName && resolvedAccountName && newAccountNumber.length === 10 && selectedBankCode && (
              <div className="bg-[var(--primary-light)] border border-[var(--primary-border)] rounded-xl px-3.5 py-2.5 flex items-center gap-2 text-xs text-[var(--primary)] font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{resolvedAccountName}</span>
              </div>
            )}

            {!isResolvingName && resolveError && newAccountNumber.length === 10 && selectedBankCode && (
              <div className="bg-[var(--danger-light)] border border-[var(--danger)]/30 rounded-xl px-3.5 py-2.5 flex items-center gap-2 text-xs text-[var(--danger)] font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{resolveError}</span>
              </div>
            )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={
                isVerifyingAccount ||
                isResolvingName ||
                newAccountNumber.length !== 10 ||
                !selectedBankCode ||
                !resolvedAccountName
              }
              className={`w-full py-3.5 px-6 rounded-full font-bold text-sm transition-all shadow-sm ${
                newAccountNumber.length === 10 && selectedBankCode && resolvedAccountName && !isResolvingName
                  ? "bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white cursor-pointer"
                  : "bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-color)] cursor-not-allowed opacity-60"
              }`}
            >
              {isVerifyingAccount ? "Linking account..." : "Continue"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
