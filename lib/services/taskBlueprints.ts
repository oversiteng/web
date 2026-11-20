export interface BlueprintInputField {
  field: string;
  label: string;
  type: "text" | "number" | "textarea" | "select" | "media";
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface BlueprintEvidenceSlot {
  key: string;
  label: string;
  required: boolean;
}

export interface TaskExecutionBlueprint {
  usesMilestones: boolean;
  operationalBrief: string;
  deliverablesChecklist: string[];
  expectedAgentInputs: BlueprintInputField[];
  evidenceSlots: BlueprintEvidenceSlot[];
  adminStructuredAt?: string | null;
}

export function getDefaultBlueprintForModule(
  moduleType?: string | null,
  quickActionType?: string | null,
  fallbackDescription?: string | null
): TaskExecutionBlueprint {
  const mod = String(moduleType || "PROPERTY_OVERSITE").toUpperCase();

  // Property Oversight Quick Actions are always single-step (no milestones)
  if (quickActionType) {
    return {
      usesMilestones: false,
      operationalBrief: fallbackDescription || "Execute predefined property intelligence task.",
      deliverablesChecklist: [],
      expectedAgentInputs: [],
      evidenceSlots: [
        { key: "site_overview", label: "Primary Site / Subject Photo", required: true },
        { key: "supporting_proof", label: "Supporting Evidence Photo", required: false },
      ],
    };
  }

  switch (mod) {
    case "QUICK_ERRANDS":
      return {
        usesMilestones: false,
        operationalBrief:
          fallbackDescription ||
          "Complete the requested errand, verify item/document authenticity, and capture handover proof.",
        deliverablesChecklist: [
          "Confirm pickup/target location on arrival",
          "Verify item or document matches client instructions",
          "Capture receipt/waybill and handover proof",
        ],
        expectedAgentInputs: [
          {
            field: "recipientOrMerchant",
            label: "Merchant / Recipient Name",
            type: "text",
            required: true,
            placeholder: "e.g. Lagos Lands Registry / Shop Name",
          },
          {
            field: "executionNotes",
            label: "Errand Outcome & Notes",
            type: "textarea",
            required: true,
            placeholder: "Summarize pickup, verification, and delivery outcome...",
          },
        ],
        evidenceSlots: [
          { key: "pickup_location", label: "Pickup / Target Site", required: true },
          { key: "item_verification", label: "Item / Document Proof", required: true },
          { key: "merchant_receipt", label: "Official Receipt / Waybill", required: false },
          { key: "handover_proof", label: "Delivery & Handover Photo", required: true },
        ],
      };

    case "VULNERABILITY_TEST":
      return {
        usesMilestones: false,
        operationalBrief:
          fallbackDescription ||
          "Conduct physical security & perimeter vulnerability assessment (Authorized for Owned Properties only).",
        deliverablesChecklist: [
          "Inspect full perimeter wall, gates, lighting, and blind spots",
          "Assess guard response and access control procedures",
          "Document vulnerabilities with geo-tagged evidence and remediation steps",
        ],
        expectedAgentInputs: [
          {
            field: "perimeterStatus",
            label: "Perimeter Fence & Gate Integrity",
            type: "text",
            required: true,
          },
          {
            field: "riskRating",
            label: "Overall Security Risk Rating",
            type: "select",
            required: true,
            options: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
          },
          {
            field: "accessVulnerabilities",
            label: "Identified Entry / Security Weaknesses",
            type: "textarea",
            required: true,
          },
          {
            field: "remediationPlan",
            label: "Recommended Security Upgrades",
            type: "textarea",
            required: true,
          },
        ],
        evidenceSlots: [
          { key: "perimeter_gate", label: "Main Gate & Perimeter Wall", required: true },
          { key: "blind_spots", label: "Identified Blind Spots / Weak Points", required: true },
          { key: "lighting_cctv", label: "Lighting & Surveillance Coverage", required: false },
        ],
      };

    case "PROJECT_WATCH":
      return {
        usesMilestones: true,
        operationalBrief:
          fallbackDescription ||
          "Inspect active construction stages, verify structural compliance, material stock, and site safety.",
        deliverablesChecklist: [
          "Verify active construction stage against engineering drawings",
          "Inspect on-site material quality and workforce presence",
          "Document structural progress with geo-tagged photographs",
        ],
        expectedAgentInputs: [
          {
            field: "currentStage",
            label: "Current Construction Stage",
            type: "text",
            required: true,
            placeholder: "e.g. First Floor Decking / Roofing",
          },
          {
            field: "completionEstimatePct",
            label: "Estimated Overall Completion (%)",
            type: "number",
            required: true,
            placeholder: "0 - 100",
          },
          {
            field: "siteObservations",
            label: "Technical & Quality Observations",
            type: "textarea",
            required: true,
          },
        ],
        evidenceSlots: [
          { key: "substructure", label: "Foundation / Active Structure", required: true },
          { key: "columns_rebar", label: "Columns & Reinforcement", required: true },
          { key: "material_stock", label: "On-Site Material Stock", required: false },
          { key: "site_signboard", label: "Project & Engineer Signboard", required: true },
        ],
      };

    case "DUE_DILIGENCE":
      return {
        usesMilestones: true,
        operationalBrief:
          fallbackDescription ||
          "Conduct statutory registry search, physical cadastral survey check, and adverse claims investigation.",
        deliverablesChecklist: [
          "Verify title / corporate registration at relevant State or CAC registry",
          "Confirm physical survey beacons and absence of encroachment",
          "Check for pending litigation or communal disputes",
        ],
        expectedAgentInputs: [
          {
            field: "registryStatus",
            label: "Registry Verification Status",
            type: "select",
            required: true,
            options: ["CLEAR", "ENCUMBERED", "PENDING_CLARIFICATION", "DISPUTED"],
          },
          {
            field: "findingsSummary",
            label: "Investigation & Registry Findings",
            type: "textarea",
            required: true,
          },
        ],
        evidenceSlots: [
          { key: "registry_stamp", label: "Registry / Bureau Search Stamp", required: true },
          { key: "survey_beacons", label: "Cadastral Survey Beacons", required: true },
          { key: "boundary_context", label: "Boundary & Access Context", required: true },
        ],
      };

    case "LEGAL_ADVISORY":
    case "LAW_ENFORCEMENT":
      return {
        usesMilestones: false,
        operationalBrief:
          fallbackDescription ||
          "Execute structured legal or statutory liaison directives and obtain certified documentation.",
        deliverablesChecklist: [
          "Follow Admin-approved rules of engagement and statutory protocol",
          "Obtain official stamp, filing receipt, or certified true copy",
        ],
        expectedAgentInputs: [
          {
            field: "authorityOffice",
            label: "Court / Ministry / Station Engaged",
            type: "text",
            required: true,
          },
          {
            field: "officialReference",
            label: "Official File / Suit / Reference Number",
            type: "text",
            required: false,
          },
          {
            field: "outcomeSummary",
            label: "Official Outcome & Next Steps",
            type: "textarea",
            required: true,
          },
        ],
        evidenceSlots: [
          { key: "certified_copy", label: "Certified True Copy (CTC)", required: true },
          { key: "official_seal", label: "Official Stamp & Seal", required: true },
          { key: "filing_receipt", label: "Statutory Filing Receipt", required: false },
        ],
      };

    case "PROPERTY_OVERSITE":
    default:
      return {
        usesMilestones: false,
        operationalBrief:
          fallbackDescription ||
          "Inspect property perimeter, occupancy status, and neighborhood environment.",
        deliverablesChecklist: [
          "Verify perimeter fence and gate integrity",
          "Check occupancy and absence of unauthorized encroachment",
          "Capture geo-tagged front, left, right, and street-view photos",
        ],
        expectedAgentInputs: [
          {
            field: "occupancy",
            label: "Occupancy Status",
            type: "select",
            required: true,
            options: ["Vacant", "Occupied (Authorized)", "Unauthorized Activity", "Under Construction"],
          },
          {
            field: "fenceCondition",
            label: "Perimeter Fence Condition",
            type: "select",
            required: true,
            options: ["Intact", "Minor Damage", "Breached", "Unfenced"],
          },
          {
            field: "siteSummary",
            label: "Field Inspection Summary",
            type: "textarea",
            required: true,
          },
        ],
        evidenceSlots: [
          { key: "front", label: "Front Elevation", required: true },
          { key: "perimeter", label: "Perimeter & Gate", required: true },
          { key: "street_view", label: "Access Road & Street View", required: true },
        ],
      };
  }
}

export function resolveTaskExecutionBlueprint(task: {
  moduleType?: string | null;
  description?: string | null;
  formData?: Record<string, any> | null;
}): TaskExecutionBlueprint {
  const fd = (task.formData && typeof task.formData === "object" ? task.formData : {}) as Record<
    string,
    any
  >;
  const defaults = getDefaultBlueprintForModule(
    task.moduleType,
    fd.quickActionType || null,
    task.description
  );

  const saved = fd.executionBlueprint as Partial<TaskExecutionBlueprint> | undefined;

  return {
    usesMilestones:
      typeof saved?.usesMilestones === "boolean"
        ? saved.usesMilestones
        : defaults.usesMilestones,
    operationalBrief:
      saved?.operationalBrief || task.description || defaults.operationalBrief,
    deliverablesChecklist:
      Array.isArray(saved?.deliverablesChecklist)
        ? saved.deliverablesChecklist
        : Array.isArray(fd.deliverablesChecklist)
        ? fd.deliverablesChecklist
        : defaults.deliverablesChecklist,
    expectedAgentInputs:
      Array.isArray(saved?.expectedAgentInputs)
        ? saved.expectedAgentInputs
        : Array.isArray(fd.expectedAgentInputs)
        ? fd.expectedAgentInputs
        : defaults.expectedAgentInputs,
    evidenceSlots:
      Array.isArray(saved?.evidenceSlots) && saved.evidenceSlots.length > 0
        ? saved.evidenceSlots
        : defaults.evidenceSlots,
    adminStructuredAt: saved?.adminStructuredAt || null,
  };
}

