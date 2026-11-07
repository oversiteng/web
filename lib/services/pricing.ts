import { TaskModule } from "@/lib/types/task";

/**
 * Service Turnaround Floor (in hours).
 * Services cannot be scheduled or promised in less time than these limits.
 */
export const SERVICE_MINIMUM_HOURS: Record<TaskModule, number> = {
  QUICK_ERRANDS: 8,
  PROPERTY_OVERSITE: 24,
  PROJECT_WATCH: 48,
  DUE_DILIGENCE: 72, // 3 days
  LEGAL_ADVISORY: 168, // 1 week (7 days)
  LAW_ENFORCEMENT: 8, // Emergency Liaison SLA
  VULNERABILITY_TEST: 24,
};

/**
 * Maps Agent Target hours to Client Promised hours using the progressive buffer table.
 *
 * Rules:
 * - 8 hrs  -> 16 hrs (+8)
 * - 12 hrs -> 24 hrs (+12)
 * - 24 hrs -> 48 hrs (+24)
 * - 48 hrs (2d) -> 84 hrs (3.5d)
 * - 72 hrs (3d) -> 108 hrs (4.5d)
 * - 168 hrs (1w) -> 240 hrs (10d)
 * - 336 hrs (2w) -> 432 hrs (18d)
 * - 504+ hrs (3w+) -> +120 hrs (+5 days)
 */
export function calculateClientBufferedHours(agentHours: number): number {
  if (agentHours <= 8) return 16;
  if (agentHours <= 12) return 24;
  if (agentHours <= 24) return 48;
  if (agentHours <= 48) return 84; // 3.5 days
  if (agentHours <= 72) return 108; // 4.5 days
  if (agentHours <= 168) return 240; // 10 days
  if (agentHours <= 336) return 432; // 18 days
  // 3 weeks and above: add 5 days (120 hours)
  return agentHours + 120;
}

export interface WaypointItem {
  address: string;
  latitude?: number;
  longitude?: number;
  contactPerson?: string;
  instructions?: string;
  stopOrder: number;
}

export interface PurchaseItem {
  name: string;
  estimatedCostNgn: number;
  quantity?: number;
  notes?: string;
}

export interface PricingCalculationInput {
  moduleType: TaskModule;
  requestedHours?: number;
  waypoints?: WaypointItem[];
  requiresOfficialDocs?: boolean;
  purchaseItems?: PurchaseItem[];
  isExpress?: boolean;
  perimeterScale?: "standard" | "large" | "estate"; // for land/property
}

export interface PricingBreakdown {
  baseFee: number;
  transitFee: number;
  stopsCount: number;
  officialDocsFee: number;
  purchaseItemsTotal: number;
  urgencyMultiplier: number;
  urgencySurcharge: number;
  totalNgn: number;
  pricingMode: "AUTOMATED" | "MANUAL_QUOTE";
  agentTargetHours: number;
  clientPromisedHours: number;
  requiresAdminQuote: boolean;
  manualQuoteReason?: string;
}

/**
 * Base service charges (in NGN)
 */
const BASE_FEES: Record<TaskModule, number> = {
  QUICK_ERRANDS: 15000,
  PROPERTY_OVERSITE: 35000,
  PROJECT_WATCH: 45000,
  DUE_DILIGENCE: 50000,
  LEGAL_ADVISORY: 50000,
  LAW_ENFORCEMENT: 75000,
  VULNERABILITY_TEST: 65000,
};

const EXTRA_STOP_FEE = 7500; // Flat transport stipend per extra waypoint
const OFFICIAL_DOCS_FEE = 15000; // Registry & certification filing fee allowance

/**
 * Computes the itemized quotation and SLA metrics.
 */
export function calculateTaskPricing(input: PricingCalculationInput): PricingBreakdown {
  const {
    moduleType,
    waypoints = [],
    requiresOfficialDocs = false,
    purchaseItems = [],
    isExpress = false,
    perimeterScale = "standard",
  } = input;

  // 1. Enforce minimum turnaround floor
  const minFloor = SERVICE_MINIMUM_HOURS[moduleType] || 8;
  const agentTargetHours = Math.max(input.requestedHours || minFloor, minFloor);
  const clientPromisedHours = calculateClientBufferedHours(agentTargetHours);

  // 2. Base Fee + Scale Adjustments
  let baseFee = BASE_FEES[moduleType] || 20000;
  if (moduleType === "PROPERTY_OVERSITE") {
    if (perimeterScale === "large") baseFee += 15000;
    if (perimeterScale === "estate") baseFee += 40000;
  }

  // 3. Multi-Stop Transit Fees (first stop is included in base fee)
  const stopsCount = Math.max(waypoints.length, 1);
  const extraStops = Math.max(0, stopsCount - 1);
  const transitFee = extraStops * EXTRA_STOP_FEE;

  // 4. Official Docs & Government Verification
  const officialDocsFee = requiresOfficialDocs ? OFFICIAL_DOCS_FEE : 0;

  // 5. Purchase Items Total
  const purchaseItemsTotal = purchaseItems.reduce((acc, item) => {
    const cost = item.estimatedCostNgn || 0;
    const qty = item.quantity || 1;
    return acc + cost * qty;
  }, 0);

  // 6. Urgency Surcharge
  const urgencyMultiplier = isExpress ? 1.3 : 1.0;
  const subtotal = baseFee + transitFee + officialDocsFee;
  const urgencySurcharge = isExpress ? Math.round(subtotal * 0.3) : 0;

  // 7. Check if task needs Manual Admin Pricing Review
  // Rules for manual quoting:
  // - High-budget purchases (> ₦100,000)
  // - Extensive multi-stops (> 4 stops)
  // - Law Enforcement liaison tasks
  let requiresAdminQuote = false;
  let manualQuoteReason: string | undefined;

  if (purchaseItemsTotal > 100000) {
    requiresAdminQuote = true;
    manualQuoteReason = "High-value purchase procurement requires admin verification.";
  } else if (stopsCount > 4) {
    requiresAdminQuote = true;
    manualQuoteReason = "Route includes 5+ waypoints; requires custom transit dispatch review.";
  } else if (moduleType === "LAW_ENFORCEMENT") {
    requiresAdminQuote = true;
    manualQuoteReason = "Law enforcement deployment scope requires dispatch supervisor assessment.";
  }

  const totalNgn = subtotal + urgencySurcharge + purchaseItemsTotal;

  return {
    baseFee,
    transitFee,
    stopsCount,
    officialDocsFee,
    purchaseItemsTotal,
    urgencyMultiplier,
    urgencySurcharge,
    totalNgn,
    pricingMode: requiresAdminQuote ? "MANUAL_QUOTE" : "AUTOMATED",
    agentTargetHours,
    clientPromisedHours,
    requiresAdminQuote,
    manualQuoteReason,
  };
}
