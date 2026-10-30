import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";

const NIGERIAN_BANKS = [
  { name: "Access Bank", code: "044", slug: "access-bank" },
  { name: "Access Bank (Diamond)", code: "063", slug: "access-bank-diamond" },
  { name: "Citibank Nigeria", code: "023", slug: "citibank-nigeria" },
  { name: "Ecobank Nigeria", code: "050", slug: "ecobank-nigeria" },
  { name: "Fidelity Bank", code: "070", slug: "fidelity-bank" },
  { name: "First Bank of Nigeria", code: "011", slug: "first-bank-of-nigeria" },
  { name: "First City Monument Bank (FCMB)", code: "214", slug: "first-city-monument-bank" },
  { name: "Guaranty Trust Bank (GTBank)", code: "058", slug: "guaranty-trust-bank" },
  { name: "Heritage Bank", code: "030", slug: "heritage-bank" },
  { name: "Jaiz Bank", code: "301", slug: "jaiz-bank" },
  { name: "Keystone Bank", code: "082", slug: "keystone-bank" },
  { name: "Kuda Microfinance Bank", code: "50211", slug: "kuda-bank" },
  { name: "Moniepoint Microfinance Bank", code: "50515", slug: "moniepoint-mfb-ng" },
  { name: "OPay Digital Services", code: "999992", slug: "paycom" },
  { name: "PalmPay", code: "999991", slug: "palmpay" },
  { name: "Polaris Bank", code: "076", slug: "polaris-bank" },
  { name: "Providus Bank", code: "101", slug: "providus-bank" },
  { name: "Stanbic IBTC Bank", code: "221", slug: "stanbic-ibtc-bank" },
  { name: "Standard Chartered Bank", code: "068", slug: "standard-chartered-bank" },
  { name: "Sterling Bank", code: "232", slug: "sterling-bank" },
  { name: "TAJ Bank", code: "302", slug: "taj-bank" },
  { name: "Union Bank of Nigeria", code: "032", slug: "union-bank-of-nigeria" },
  { name: "United Bank for Africa (UBA)", code: "033", slug: "united-bank-for-africa" },
  { name: "Unity Bank", code: "215", slug: "unity-bank" },
  { name: "Wema Bank / ALAT", code: "035", slug: "wema-bank" },
  { name: "Zenith Bank", code: "057", slug: "zenith-bank" },
];

let cachedBanks: any[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

// GET /api/v1/banks — Authoritative Nigerian Commercial & Fintech Banks Directory
export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      const now = Date.now();
      if (cachedBanks && now - lastFetchTime < CACHE_TTL_MS) {
        return NextResponse.json<ApiResponse<typeof cachedBanks>>({
          success: true,
          data: cachedBanks,
          message: "Authoritative Nigerian banks directory (cached).",
        });
      }

      const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
      if (paystackSecret && !paystackSecret.includes("dummy")) {
        try {
          const res = await fetch("https://api.paystack.co/bank?country=nigeria&perPage=100", {
            headers: {
              Authorization: `Bearer ${paystackSecret}`,
            },
          });
          const json = await res.json();
          if (json.status && Array.isArray(json.data) && json.data.length > 0) {
            cachedBanks = json.data.map((b: any) => ({
              name: b.name,
              code: b.code,
              slug: b.slug,
            }));
            lastFetchTime = now;
            return NextResponse.json<ApiResponse<typeof cachedBanks>>({
              success: true,
              data: cachedBanks,
              message: "Authoritative Nigerian banks directory (live from Paystack).",
            });
          }
        } catch (fetchErr) {
          console.warn("Notice: Paystack banks API fallback to offline directory.");
        }
      }

      cachedBanks = NIGERIAN_BANKS;
      lastFetchTime = now;

      return NextResponse.json<ApiResponse<typeof NIGERIAN_BANKS>>({
        success: true,
        data: NIGERIAN_BANKS,
        message: "Authoritative Nigerian banks directory.",
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INTERNAL_ERROR", message: (error as Error).message },
        },
        { status: 500 }
      );
    }
  },
  { roles: ["USER", "AGENT", "ADMIN", "SUPER_ADMIN"] }
);
