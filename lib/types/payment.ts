// ─── Payment & Wallet Type Definitions ──────────────────────────────────────

export type PaymentStatus =
  | "PENDING"
  | "AUTHORIZED"
  | "CAPTURED"
  | "ESCROWED"
  | "RELEASED"
  | "REFUNDED"
  | "FAILED";

export type PaymentGateway = "PAYSTACK" | "FLUTTERWAVE";
export type PayoutStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface Payment {
  id: string;
  taskId: string;
  userId: string;
  amountNgn: number;
  gateway: PaymentGateway;
  gatewayRef?: string | null;
  status: PaymentStatus;
  escrowReleasedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface AgentWallet {
  id: string;
  agentId: string;
  balanceNgn: number;
  totalEarnedNgn: number;
  updatedAt?: string;
}

export interface PayoutTransaction {
  id: string;
  walletId: string;
  agentId: string;
  amountNgn: number;
  bankCode: string;
  accountNumber: string;
  gatewayRef?: string | null;
  status: PayoutStatus;
  createdAt: string;
  processedAt?: string | null;
}
