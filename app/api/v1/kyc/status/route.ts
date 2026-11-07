import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { users, agentProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/v1/kyc/status — Aggregated 6-Step Operative Accreditation Status Pipeline
export const GET = withAuth(async (req: NextRequest, { user }) => {
  try {
    const db = await getDbReady();

    const userRecords = await db
      .select({
        id: users.id,
        email: users.email,
        phone: users.phone,
        name: users.name,
        role: users.role,
        kycStatus: users.kycStatus,
        ninVerificationStatus: users.ninVerificationStatus,
        nbaVerificationStatus: users.nbaVerificationStatus,
        addressVerificationStatus: users.addressVerificationStatus,
        accreditationDocuments: users.accreditationDocuments,
        consentSignedAt: users.consentSignedAt,
      })
      .from(users)
      .where(eq(users.id, user.sub))
      .limit(1);

    if (userRecords.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found." } },
        { status: 404 }
      );
    }

    const u = userRecords[0];

    // Fetch operative profile if available
    const profiles = await db
      .select()
      .from(agentProfiles)
      .where(eq(agentProfiles.userId, user.sub))
      .limit(1);

    const profile = profiles[0];
    const docs = (u.accreditationDocuments as Record<string, any>) || {};

    // 1. Phone Verification Step
    const isPhoneVerified = Boolean(u.phone && u.phone.trim().length >= 10);
    // 2. NIN Verification Step
    const isNinVerified = u.ninVerificationStatus === "verified";
    // 3. Professional Accreditation / Agent Tier Step
    const isNbaVerified = u.nbaVerificationStatus === "verified";
    const isProfessionalVerified = isNbaVerified || Boolean(profile && profile.tier);
    // 4. Proof of Address / Residency
    const isAddressVerified =
      u.addressVerificationStatus === "verified" ||
      u.addressVerificationStatus === "submitted" ||
      Boolean(
        docs.utility_bill ||
        docs.utilityBill ||
        docs.proof_of_address ||
        docs.proofOfAddress
      );
    // 5. Background Check & Compliance Consent
    const isConsentSigned = Boolean(u.consentSignedAt);
    // 6. Bank Account Configured for Payouts
    const isBankConfigured = Boolean(profile?.bankCode && profile?.bankAccountNumber);

    const steps = {
      step1Phone: {
        title: "Phone Verification",
        status: isPhoneVerified ? "VERIFIED" : "PENDING",
        completed: isPhoneVerified,
      },
      step2IdentityNIN: {
        title: "National Identity Number (NIN)",
        status: isNinVerified ? "VERIFIED" : (u.ninVerificationStatus.toUpperCase() || "PENDING"),
        completed: isNinVerified,
      },
      step3Accreditation: {
        title: "Professional Accreditation (NBA / Certification)",
        status: isProfessionalVerified ? "VERIFIED" : (u.nbaVerificationStatus.toUpperCase() || "PENDING"),
        completed: isProfessionalVerified,
        tier: profile?.tier || (isNbaVerified ? "LEGAL_COUNSEL" : "GENERAL"),
      },
      step4ProofOfAddress: {
        title: "Proof of Address & Residency",
        status: isAddressVerified ? "VERIFIED" : (u.addressVerificationStatus.toUpperCase() || "PENDING"),
        completed: isAddressVerified,
      },
      step5ComplianceConsent: {
        title: "Background Investigation & Compliance Consent",
        status: isConsentSigned ? "VERIFIED" : "PENDING",
        completed: isConsentSigned,
        signedAt: u.consentSignedAt ? u.consentSignedAt.toISOString() : null,
      },
      step6BankSettlement: {
        title: "Bank Settlement Details",
        status: isBankConfigured ? "VERIFIED" : "PENDING",
        completed: isBankConfigured,
        bankCode: profile?.bankCode || null,
      },
    };

    const completedStepsCount = [
      isPhoneVerified,
      isNinVerified,
      isProfessionalVerified,
      isAddressVerified,
      isConsentSigned,
      isBankConfigured,
    ].filter(Boolean).length;

    // Calculate next required step
    let currentStep = 1;
    if (!isPhoneVerified) currentStep = 1;
    else if (!isNinVerified) currentStep = 2;
    else if (!isProfessionalVerified) currentStep = 3;
    else if (!isAddressVerified) currentStep = 4;
    else if (!isConsentSigned) currentStep = 5;
    else if (!isBankConfigured) currentStep = 6;
    else currentStep = 6;

    const isFullyAccredited = completedStepsCount === 6 && u.kycStatus === "VERIFIED";

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: {
        userId: u.id,
        role: u.role,
        kycStatus: u.kycStatus,
        ninVerificationStatus: u.ninVerificationStatus,
        nbaVerificationStatus: u.nbaVerificationStatus,
        addressVerificationStatus: u.addressVerificationStatus,
        completedSteps: completedStepsCount,
        totalSteps: 6,
        currentStep,
        isFullyAccredited,
        pipelineProgressPct: Math.round((completedStepsCount / 6) * 100),
        steps,
      },
      message: "Aggregated 6-step operative accreditation pipeline retrieved successfully.",
    });
  } catch (error) {
    console.error("KYC Status GET Error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: (error as Error).message } },
      { status: 500 }
    );
  }
});
