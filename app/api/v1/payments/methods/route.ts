import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
}

// In-memory / mock payment methods fallback
const mockMethods: PaymentMethod[] = [
  {
    id: "pm-1",
    brand: "Mastercard",
    last4: "4242",
    expiryMonth: "12",
    expiryYear: "28",
    isDefault: true,
  },
  {
    id: "pm-2",
    brand: "Visa",
    last4: "8888",
    expiryMonth: "09",
    expiryYear: "27",
    isDefault: false,
  },
];

export const GET = withAuth(async (req: NextRequest, { user }) => {
  return NextResponse.json<ApiResponse<PaymentMethod[]>>({
    success: true,
    data: mockMethods,
  });
});

export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const { cardNumber, expiry, cvv, brand } = body;

    const last4 = cardNumber ? String(cardNumber).slice(-4) : "1234";
    const [expiryMonth = "12", expiryYear = "28"] = (expiry || "12/28").split("/");

    const newMethod: PaymentMethod = {
      id: `pm-${Date.now()}`,
      brand: brand || "Visa",
      last4,
      expiryMonth,
      expiryYear,
      isDefault: false,
    };

    return NextResponse.json<ApiResponse<PaymentMethod>>(
      {
        success: true,
        data: newMethod,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: (error as Error).message },
      },
      { status: 500 }
    );
  }
});
