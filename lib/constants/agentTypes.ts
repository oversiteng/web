export type CanonicalAgentTier =
  | "INVESTIGATOR"
  | "TECHNICAL_SUPERVISOR"
  | "GENERAL"
  | "LEGAL_COUNSEL"
  | "ENFORCEMENT_LIAISON";

export interface AgentQualificationOption {
  value: string;
  label: string;
  issuingBodyLabel: string;
  issuingBodyPlaceholder: string;
  numberLabel: string;
  numberPlaceholder: string;
  uploadPrompt: string;
  isNba?: boolean;
}

export interface AgentTypeOption {
  /** Database enum code stored in agent_profiles.tier */
  tierCode: CanonicalAgentTier;
  /** Canonical human-readable label used everywhere in UI & occupation/specialty */
  label:
    | "Field Investigator"
    | "Site Supervisor"
    | "Property Inspector"
    | "Legal Liaison Agent"
    | "Courier Agent";
  /** Brief description of role responsibilities */
  description: string;
  /** Dynamic 5th verification credential config for /agent/verification & /admin/users */
  credential: {
    id: string;
    docType:
      | "INVESTIGATION_CERTIFICATE"
      | "CAC_CERTIFICATE"
      | "BAR_PRACTICING_LICENSE"
      | "GOVERNMENT_ID";
    docKey: string;
    title: string;
    shortLabel: string;
    issuingBodyLabel: string;
    issuingBodyPlaceholder: string;
    numberLabel: string;
    numberPlaceholder: string;
    uploadPrompt: string;
    isNba?: boolean;
    qualificationOptions: AgentQualificationOption[];
  };
}

const ACADEMIC_DEGREE_QUALIFICATION: AgentQualificationOption = {
  value: "BSC_HND_EQUIVALENT",
  label: "B.Sc / HND / B.Eng / LL.B or Equivalent Degree Certificate",
  issuingBodyLabel: "University / Polytechnic / Institution",
  issuingBodyPlaceholder: "e.g. University of Lagos / Yaba College of Technology",
  numberLabel: "Certificate / Matriculation / NYSC Reference No.",
  numberPlaceholder: "e.g. UNILAG-BSC-2023-0842 or NYSC/2024/11920",
  uploadPrompt:
    "Upload your B.Sc, HND, or equivalent degree certificate / statement of result",
};

export const CANONICAL_AGENT_TYPES: AgentTypeOption[] = [
  {
    tierCode: "INVESTIGATOR",
    label: "Field Investigator",
    description: "On-site fact finding, community inquiries, and registry verification",
    credential: {
      id: "professional-cert",
      docType: "INVESTIGATION_CERTIFICATE",
      docKey: "investigation_certificate",
      title: "Investigation / B.Sc / HND Certificate",
      shortLabel: "Investigation Certificate or B.Sc / HND Equivalent",
      issuingBodyLabel: "Issuing Institution / University / Body",
      issuingBodyPlaceholder: "e.g. University of Lagos or Certified Institute of Investigators",
      numberLabel: "Certificate / License / Degree Number",
      numberPlaceholder: "e.g. CII-NG-20489 or B.Sc Certificate No.",
      uploadPrompt:
        "Upload your Investigation Certificate or B.Sc / HND / Equivalent Degree Certificate",
      qualificationOptions: [
        {
          value: "PROFESSIONAL_LICENSE",
          label: "Investigation / Security Accreditation Certificate",
          issuingBodyLabel: "Issuing Body / Institution",
          issuingBodyPlaceholder: "e.g. Certified Institute of Investigators / Police Licensing",
          numberLabel: "Certificate / License Number",
          numberPlaceholder: "e.g. CII-NG-20489",
          uploadPrompt: "Upload your investigation or security accreditation certificate",
        },
        ACADEMIC_DEGREE_QUALIFICATION,
      ],
    },
  },
  {
    tierCode: "TECHNICAL_SUPERVISOR",
    label: "Site Supervisor",
    description: "Construction stage audits, structural checks, and material verification",
    credential: {
      id: "professional-cert",
      docType: "INVESTIGATION_CERTIFICATE",
      docKey: "investigation_certificate",
      title: "Engineering License or B.Sc / HND",
      shortLabel: "COREN / NIOB License or B.Sc / B.Eng / HND Certificate",
      issuingBodyLabel: "Regulatory Council or University / Polytechnic",
      issuingBodyPlaceholder: "e.g. COREN, NIOB, ARCON, or University / Polytechnic",
      numberLabel: "Registration / Seal / Degree Certificate Number",
      numberPlaceholder: "e.g. COREN R.45812 or B.Eng / HND Cert No.",
      uploadPrompt:
        "Upload your COREN/NIOB practicing license or B.Sc / B.Eng / HND degree certificate",
      qualificationOptions: [
        {
          value: "PROFESSIONAL_LICENSE",
          label: "COREN / NIOB / ARCON / NIQS Professional License",
          issuingBodyLabel: "Regulatory Council / Body",
          issuingBodyPlaceholder: "e.g. COREN, NIOB, ARCON, or NIQS",
          numberLabel: "Registration / Seal Number",
          numberPlaceholder: "e.g. COREN R.45812",
          uploadPrompt: "Upload your COREN, NIOB, or technical practicing license",
        },
        ACADEMIC_DEGREE_QUALIFICATION,
      ],
    },
  },
  {
    tierCode: "GENERAL",
    label: "Property Inspector",
    description: "Physical property condition, perimeter geofence, and occupancy checks",
    credential: {
      id: "professional-cert",
      docType: "INVESTIGATION_CERTIFICATE",
      docKey: "investigation_certificate",
      title: "Inspection Credential or B.Sc / HND",
      shortLabel: "NIESV / ESVARBON or B.Sc / HND / Equivalent Certificate",
      issuingBodyLabel: "Association or University / Polytechnic",
      issuingBodyPlaceholder: "e.g. NIESV, ESVARBON, or University / Polytechnic",
      numberLabel: "Credential / Membership / Degree Certificate Number",
      numberPlaceholder: "e.g. ANIVS-10942 or B.Sc / HND Cert No.",
      uploadPrompt:
        "Upload your property inspection certificate or B.Sc / HND / equivalent degree certificate",
      qualificationOptions: [
        {
          value: "PROFESSIONAL_LICENSE",
          label: "NIESV / ESVARBON / Property Inspection Certificate",
          issuingBodyLabel: "Issuing Body / Association",
          issuingBodyPlaceholder: "e.g. NIESV, ESVARBON, or Facility Management Institute",
          numberLabel: "Credential / Membership Number",
          numberPlaceholder: "e.g. ANIVS-10942",
          uploadPrompt: "Upload your property inspection certificate or professional ID",
        },
        ACADEMIC_DEGREE_QUALIFICATION,
      ],
    },
  },
  {
    tierCode: "LEGAL_COUNSEL",
    label: "Legal Liaison Agent",
    description: "NBA-enrolled legal practitioner or LL.B / B.Sc graduate for statutory liaison",
    credential: {
      id: "professional-cert",
      docType: "BAR_PRACTICING_LICENSE",
      docKey: "bar_practicing_license",
      title: "NBA Verification or LL.B / B.Sc / HND",
      shortLabel: "NBA Bar Enrollment or LL.B / B.Sc / HND Certificate",
      issuingBodyLabel: "NBA Branch or University / Institution",
      issuingBodyPlaceholder: "e.g. Nigerian Bar Association (Lagos Branch) or University",
      numberLabel: "NBA Supreme Court Number (SCN) or Degree Certificate No.",
      numberPlaceholder: "e.g. SCN084512 or LL.B / B.Sc Cert No.",
      uploadPrompt:
        "Upload your Call to Bar / NBA Practicing License or LL.B / B.Sc / HND Degree Certificate",
      isNba: true,
      qualificationOptions: [
        {
          value: "NBA_LICENSE",
          label: "NBA Call to Bar / Supreme Court Enrollment (SCN)",
          issuingBodyLabel: "NBA Branch",
          issuingBodyPlaceholder: "e.g. Nigerian Bar Association (Lagos Branch)",
          numberLabel: "NBA Supreme Court Enrollment Number (SCN)",
          numberPlaceholder: "e.g. SCN084512",
          uploadPrompt: "Upload your Call to Bar Certificate or current NBA Practicing License",
          isNba: true,
        },
        ACADEMIC_DEGREE_QUALIFICATION,
      ],
    },
  },
  {
    tierCode: "ENFORCEMENT_LIAISON",
    label: "Courier Agent",
    description: "Fast-track document dispatch, registry pickups, and verified errands",
    credential: {
      id: "professional-cert",
      docType: "INVESTIGATION_CERTIFICATE",
      docKey: "investigation_certificate",
      title: "Courier Permit or B.Sc / HND",
      shortLabel: "Driver's License / Courier Permit or B.Sc / HND / ND",
      issuingBodyLabel: "Issuing Authority or University / Polytechnic",
      issuingBodyPlaceholder: "e.g. FRSC / State MVAA or University / Polytechnic",
      numberLabel: "Permit / License / Degree Certificate Number",
      numberPlaceholder: "e.g. AAA12345AA12 or B.Sc / HND Cert No.",
      uploadPrompt:
        "Upload your Driver's License / Courier Permit or B.Sc / HND / Equivalent Certificate",
      qualificationOptions: [
        {
          value: "PROFESSIONAL_LICENSE",
          label: "Driver's License / Courier Dispatch Permit",
          issuingBodyLabel: "Issuing Authority",
          issuingBodyPlaceholder: "e.g. FRSC / State MVAA / Logistics Permit",
          numberLabel: "Driver's License / Permit Number",
          numberPlaceholder: "e.g. AAA12345AA12",
          uploadPrompt: "Upload your valid Driver's License or Courier Dispatch Permit",
        },
        ACADEMIC_DEGREE_QUALIFICATION,
      ],
    },
  },
];

export const CANONICAL_AGENT_TYPE_LABELS = CANONICAL_AGENT_TYPES.map((t) => t.label);

const LEGACY_TO_TIER_MAP: Record<string, CanonicalAgentTier> = {
  // DB enum codes
  INVESTIGATOR: "INVESTIGATOR",
  TECHNICAL_SUPERVISOR: "TECHNICAL_SUPERVISOR",
  GENERAL: "GENERAL",
  LEGAL_COUNSEL: "LEGAL_COUNSEL",
  ENFORCEMENT_LIAISON: "ENFORCEMENT_LIAISON",
  // Canonical labels
  "FIELD INVESTIGATOR": "INVESTIGATOR",
  "SITE SUPERVISOR": "TECHNICAL_SUPERVISOR",
  "PROPERTY INSPECTOR": "GENERAL",
  "LEGAL LIAISON AGENT": "LEGAL_COUNSEL",
  "COURIER AGENT": "ENFORCEMENT_LIAISON",
  // Legacy / old signup & coverage strings
  LEGAL: "LEGAL_COUNSEL",
  TECHNICAL: "TECHNICAL_SUPERVISOR",
  "FIELD INSPECTOR (GENERAL)": "GENERAL",
  "LEGAL ADVISOR / COUNSEL": "LEGAL_COUNSEL",
  "QUANTITY SURVEYOR / STRUCTURAL": "TECHNICAL_SUPERVISOR",
  "BUILDING INSPECTOR / ENGINEER": "TECHNICAL_SUPERVISOR",
  "LEGAL / DUE DILIGENCE OPERATIVE": "LEGAL_COUNSEL",
  "DOCUMENT RETRIEVAL RUNNER": "ENFORCEMENT_LIAISON",
  "PROPERTY OVERSITE SUPERVISOR": "SITE_SUPERVISOR" as unknown as CanonicalAgentTier,
};

export function normalizeAgentTier(raw?: string | null): CanonicalAgentTier {
  if (!raw) return "GENERAL";
  const upper = raw.trim().toUpperCase();
  if (upper === "PROPERTY OVERSITE SUPERVISOR") return "TECHNICAL_SUPERVISOR";
  return LEGACY_TO_TIER_MAP[upper] || "GENERAL";
}

export function getAgentTypeOption(rawTierOrLabel?: string | null): AgentTypeOption {
  const code = normalizeAgentTier(rawTierOrLabel);
  return (
    CANONICAL_AGENT_TYPES.find((t) => t.tierCode === code) || CANONICAL_AGENT_TYPES[2] // Property Inspector
  );
}

export function getAgentTypeLabel(rawTierOrLabel?: string | null): string {
  return getAgentTypeOption(rawTierOrLabel).label;
}

