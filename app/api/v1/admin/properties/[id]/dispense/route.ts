import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { properties, tasks, taskMilestones, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { parsePropertyDescriptionMeta } from "@/lib/services/propertyTaskService";

const ACTION_CONFIG: Record<
  string,
  {
    titlePrefix: string;
    moduleType:
      | "PROPERTY_OVERSITE"
      | "DUE_DILIGENCE"
      | "PROJECT_WATCH"
      | "VULNERABILITY_TEST";
    description: string;
    ownedOnly?: boolean;
    agentPayoutNgn: number;
    expectedAgentInputs: Array<{ field: string; label: string; type: string; required: boolean }>;
    checklist: string[];
  }
> = {
  BUILDING_MATERIAL_COST: {
    titlePrefix: "Building Material Cost Audit",
    moduleType: "PROJECT_WATCH",
    description:
      "Predefined subscription task: Audit local building material prices, supplier quotes, and construction cost benchmarks around this property.",
    agentPayoutNgn: 8000,
    expectedAgentInputs: [
      { field: "cementPriceNgn", label: "Cement Price per Bag (NGN)", type: "number", required: true },
      { field: "sandTripPriceNgn", label: "Sharp Sand per Trip (NGN)", type: "number", required: true },
      { field: "ironRodPriceNgn", label: "12mm Iron Rod per Ton (NGN)", type: "number", required: true },
      { field: "marketSummary", label: "Local Supplier & Market Trend Notes", type: "textarea", required: true },
      { field: "evidencePhotos", label: "Supplier Quote / Yard Photos", type: "media", required: true },
    ],
    checklist: [
      "Survey at least 2 local building material depots within 5km",
      "Record current unit prices for cement, sand, granite, and reinforcement rods",
      "Attach geo-tagged photos or written price sheets",
    ],
  },
  EXPERT_REVIEW: {
    titlePrefix: "Expert Review Report",
    moduleType: "DUE_DILIGENCE",
    description:
      "Predefined subscription task: Conduct technical civil/estate expert review, survey beacon check, and unified property valuation recommendation.",
    agentPayoutNgn: 15000,
    expectedAgentInputs: [
      { field: "headline", label: "Recommendation Headline", type: "text", required: true },
      { field: "rating", label: "Technical Score (e.g. 9.2 / 10)", type: "text", required: true },
      { field: "reviewer", label: "Lead Reviewer Name & Credential", type: "text", required: true },
      { field: "summary", label: "Detailed Structural & Cadastral Findings", type: "textarea", required: true },
      { field: "evidencePhotos", label: "Beacon & Site Condition Photos", type: "media", required: true },
    ],
    checklist: [
      "Verify physical boundary beacons against site layout",
      "Assess structural integrity, drainage, and access road condition",
      "Provide unified expert recommendation & score",
    ],
  },
  STATE_POLICY_UPDATES: {
    titlePrefix: "State Policy & Statutory Update",
    moduleType: "PROPERTY_OVERSITE",
    description:
      "Predefined subscription task: Check state physical planning directives, land-use zoning changes, and statutory layout compliance for this corridor.",
    agentPayoutNgn: 7500,
    expectedAgentInputs: [
      { field: "authorityName", label: "State Ministry / Planning Authority", type: "text", required: true },
      { field: "directiveSummary", label: "Policy / Zoning Directive Summary", type: "textarea", required: true },
      { field: "impactLevel", label: "Impact Level (NONE / LOW / MEDIUM / HIGH)", type: "select", required: true },
      { field: "supportingDocs", label: "Gazette / Circular Reference Photo", type: "media", required: false },
    ],
    checklist: [
      "Check latest state physical planning & land-use circulars for the LGA",
      "Verify if road expansion, setback, or acquisition notices affect the corridor",
      "Summarize compliance action items for the property owner",
    ],
  },
  LANDMARKS: {
    titlePrefix: "Vicinity Landmarks Verification",
    moduleType: "PROPERTY_OVERSITE",
    description:
      "Predefined subscription task: Document and verify key vicinity transit nodes, commercial hubs, and infrastructure landmarks near the property.",
    agentPayoutNgn: 6000,
    expectedAgentInputs: [
      { field: "landmarkName", label: "Landmark Name", type: "text", required: true },
      { field: "distance", label: "Distance & Travel Time (e.g. 1.2 km · 4 mins)", type: "text", required: true },
      { field: "feature", label: "Infrastructure / Commercial Significance", type: "textarea", required: true },
      { field: "landmarkPhotos", label: "Geo-tagged Landmark Photos", type: "media", required: true },
    ],
    checklist: [
      "Identify new or major transit, school, hospital, or commercial landmarks",
      "Measure approximate distance and drive time from property gate",
      "Capture geo-tagged photographs",
    ],
  },
  WORD_ON_STREET: {
    titlePrefix: "Word on the Street Intel",
    moduleType: "PROPERTY_OVERSITE",
    description:
      "Predefined subscription task: Conduct discreet community, caretaker, and neighbor inquiries regarding disputes, encroachment, or neighborhood sentiment.",
    agentPayoutNgn: 7500,
    expectedAgentInputs: [
      { field: "headline", label: "Intel Headline", type: "text", required: true },
      { field: "sourcesChecked", label: "Number of Local Sources Interviewed", type: "number", required: true },
      { field: "confidenceScore", label: "Confidence Score (e.g. 95%)", type: "text", required: true },
      { field: "summary", label: "Community & Neighbor Findings", type: "textarea", required: true },
    ],
    checklist: [
      "Interview at least 2–3 nearby caretakers, security guards, or shop owners",
      "Check for any communal claims, family disputes, or land-grabber activity",
      "Report neighborhood sentiment and any encroachment indicators",
    ],
  },
  COMMUNITY_UPDATE: {
    titlePrefix: "Community & Estate Update",
    moduleType: "PROPERTY_OVERSITE",
    description:
      "Predefined subscription task: Gather estate association updates, security developments, and neighborhood infrastructure news affecting the property.",
    agentPayoutNgn: 6000,
    expectedAgentInputs: [
      { field: "headline", label: "Community Update Headline", type: "text", required: true },
      { field: "summary", label: "Estate / CDA Dues, Security & Infrastructure Notes", type: "textarea", required: true },
      { field: "evidencePhotos", label: "Notice Board / Roadwork Photos", type: "media", required: false },
    ],
    checklist: [
      "Check estate association / CDA announcements and security posture",
      "Note any ongoing road, power, or drainage infrastructure projects",
    ],
  },
  VULNERABILITY_TEST: {
    titlePrefix: "Property Vulnerability Test",
    moduleType: "VULNERABILITY_TEST",
    description:
      "Predefined subscription task: Conduct physical security & perimeter vulnerability assessment (Authorized for Owned Properties only).",
    ownedOnly: true,
    agentPayoutNgn: 18000,
    expectedAgentInputs: [
      { field: "perimeterStatus", label: "Perimeter Fence & Gate Integrity", type: "text", required: true },
      { field: "accessVulnerabilities", label: "Identified Entry / Security Weaknesses", type: "textarea", required: true },
      { field: "riskRating", label: "Risk Rating (LOW / MEDIUM / HIGH / CRITICAL)", type: "select", required: true },
      { field: "remediationPlan", label: "Recommended Security Upgrades", type: "textarea", required: true },
      { field: "evidencePhotos", label: "Geo-tagged Perimeter & Blind-Spot Photos", type: "media", required: true },
    ],
    checklist: [
      "Inspect full perimeter wall, gates, lighting, and blind spots",
      "Assess guard response / access control procedures (with owner authorization)",
      "Document vulnerabilities with geo-tagged evidence and remediation steps",
    ],
  },
};

export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, { params }) => {
    try {
      const { id: propertyId } = await params;
      const body = await req.json();
      const { actionType, notes } = body;

      const cfg = ACTION_CONFIG[actionType];
      if (!cfg) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "INVALID_ACTION", message: "Unsupported quick action type" },
          },
          { status: 400 }
        );
      }

      const db = await getDbReady();
      const [prop] = await db
        .select()
        .from(properties)
        .where(eq(properties.id, propertyId))
        .limit(1);

      if (!prop) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Property not found" } },
          { status: 404 }
        );
      }

      const meta = parsePropertyDescriptionMeta(prop.description, prop.parcelNumber);
      let ext: Record<string, any> = {};
      try {
        const parsed = prop.description ? JSON.parse(prop.description) : {};
        if (parsed && parsed.__meta) ext = parsed;
      } catch {
        // ignore
      }

      if (cfg.ownedOnly && meta.ownershipType !== "OWNED") {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "FORBIDDEN_PROPERTY_TYPE",
              message:
                "Vulnerability tests can only be dispensed for client-owned properties with verified access permissions.",
            },
          },
          { status: 400 }
        );
      }

      const assignedAgentId = ext.assignedAgentId || null;
      const scheduleConfig = ext.scheduleConfig || {
        cadence: "SEMI_ANNUALLY",
        autoDispenseEnabled: true,
        subscriptionTier: "STANDARD",
      };

      // Subscription-included property task: NO client charge and NO platform margin
      const [createdTask] = await db
        .insert(tasks)
        .values({
          userId: prop.userId,
          agentId: assignedAgentId,
          propertyId: prop.id,
          moduleType: cfg.moduleType,
          status: assignedAgentId ? "MATCHED" : "PENDING",
          priority: actionType === "VULNERABILITY_TEST" ? "high" : "normal",
          title: `${cfg.titlePrefix}: ${prop.title}`,
          description: notes ? `${cfg.description}\n\nAdmin Directive: ${notes}` : cfg.description,
          locationAddress: prop.address,
          locationLat: prop.latitude,
          locationLng: prop.longitude,
          priceNgn: "0",
          pricingMode: "SUBSCRIPTION_INCLUDED",
          quoteStatus: "INCLUDED_IN_SUBSCRIPTION",
          pricingBreakdown: {
            clientPriceNgn: 0,
            agentPayoutNgn: cfg.agentPayoutNgn,
            platformMarginNgn: 0,
            isSubscriptionIncluded: true,
            isAgentPayExplicitlySet: true,
          },
          formData: {
            isPropertyIntelTask: true,
            isSubscriptionIncluded: true,
            quickActionType: actionType,
            propertyId: prop.id,
            propertyTitle: prop.title,
            ownershipType: meta.ownershipType,
            scheduleCadence: scheduleConfig.cadence,
            subscriptionTier: scheduleConfig.subscriptionTier,
            expectedAgentInputs: cfg.expectedAgentInputs,
            deliverablesChecklist: cfg.checklist,
          },
        })
        .returning();

      await db.insert(taskMilestones).values({
        taskId: createdTask.id,
        title: cfg.titlePrefix,
        description: cfg.description,
        orderIndex: 1,
        checklist: cfg.checklist.map((label, idx) => ({
          id: `chk-${idx + 1}`,
          label,
          completed: false,
        })),
        status: "PENDING",
        completionPct: 0,
      });

      if (assignedAgentId) {
        await db.insert(notifications).values({
          userId: assignedAgentId,
          type: "TASK_UPDATE",
          title: `New Property Task Dispensed: ${cfg.titlePrefix}`,
          body: `You have been assigned "${cfg.titlePrefix}" for ${prop.title} (${prop.address}). Please complete all required field inputs for Admin review.`,
          taskId: createdTask.id,
        });
      }

      await db.insert(notifications).values({
        userId: prop.userId,
        type: "TASK_UPDATE",
        title: `${cfg.titlePrefix} Initiated`,
        body: `Central Operations has dispensed a ${cfg.titlePrefix} task for ${prop.title}. Once completed and reviewed, results will appear on your property timeline.`,
        taskId: createdTask.id,
      });

      return NextResponse.json<ApiResponse<any>>({
        success: true,
        data: {
          id: createdTask.id,
          title: createdTask.title,
          moduleType: createdTask.moduleType,
          status: createdTask.status,
          createdAt: createdTask.createdAt.toISOString(),
        },
        message: `${cfg.titlePrefix} task dispensed (Subscription-included, ₦0 client charge).`,
      });
    } catch (error) {
      console.error("Admin Dispense Property Task Error:", error);
      return NextResponse.json(
        { success: false, error: { code: "INTERNAL_ERROR", message: (error as Error).message } },
        { status: 500 }
      );
    }
  },
  { roles: ["ADMIN", "SUPER_ADMIN"] }
);
