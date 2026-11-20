import { eq, inArray } from "drizzle-orm";
import { tasks, users, agentProfiles } from "@/db/schema";
import {
  PropertyCurrentTask,
  PropertyIntelTimeline,
  PropertyWithCurrentTask,
  TaskModule,
  TaskStatus,
} from "@/lib/types/task";

export interface RawTaskJoin {
  id: string;
  propertyId: string | null;
  title: string;
  moduleType: string;
  status: string;
  agentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  scheduledAt: Date | null;
  completedAt: Date | null;
  clientPromisedDeliveryDate: Date | null;
  agentName: string | null;
  agentRole: string | null;
  agentTier: string | null;
}

export function getDefaultPropertyIntelTimeline(): PropertyIntelTimeline {
  return {
    clearanceStatus: "Pending",
    siteSummaries: [],
    wordOnStreet: [],
    expertReviews: [],
    policyUpdates: [],
    landmarks: [],
  };
}

export function parsePropertyDescriptionMeta(
  rawDescription?: string | null,
  parcelNumber?: string | null
): {
  description?: string;
  ownershipType: "OWNED" | "OTHER";
  baselinePhotos: string[];
  proofOfOwnershipUrl?: string | null;
  intelTimeline: PropertyIntelTimeline;
} {
  const defaultOwnership: "OWNED" | "OTHER" =
    parcelNumber === "OTHER_WATCH" ? "OTHER" : "OWNED";
  const defaults = getDefaultPropertyIntelTimeline();

  if (!rawDescription) {
    return {
      description: undefined,
      ownershipType: defaultOwnership,
      baselinePhotos: [],
      proofOfOwnershipUrl: null,
      intelTimeline: defaults,
    };
  }

  if (rawDescription.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(rawDescription);
      if (parsed && parsed.__meta) {
        const rawIntel = parsed.intelTimeline || {};
        const intelTimeline: PropertyIntelTimeline = {
          clearanceStatus: rawIntel.clearanceStatus || defaults.clearanceStatus,
          siteSummaries:
            Array.isArray(rawIntel.siteSummaries) && rawIntel.siteSummaries.length > 0
              ? rawIntel.siteSummaries
              : defaults.siteSummaries,
          wordOnStreet:
            Array.isArray(rawIntel.wordOnStreet) && rawIntel.wordOnStreet.length > 0
              ? rawIntel.wordOnStreet
              : defaults.wordOnStreet,
          expertReviews:
            Array.isArray(rawIntel.expertReviews) && rawIntel.expertReviews.length > 0
              ? rawIntel.expertReviews
              : defaults.expertReviews,
          policyUpdates:
            Array.isArray(rawIntel.policyUpdates) && rawIntel.policyUpdates.length > 0
              ? rawIntel.policyUpdates
              : defaults.policyUpdates,
          landmarks:
            Array.isArray(rawIntel.landmarks) && rawIntel.landmarks.length > 0
              ? rawIntel.landmarks
              : defaults.landmarks,
        };

        return {
          description: parsed.landmarkDescription || undefined,
          ownershipType:
            parsed.ownershipType === "OTHER" ? "OTHER" : defaultOwnership,
          baselinePhotos: Array.isArray(parsed.baselinePhotos)
            ? parsed.baselinePhotos.filter(Boolean)
            : [],
          proofOfOwnershipUrl: parsed.proofOfOwnershipUrl || null,
          intelTimeline,
        };
      }
    } catch {
      // Fallback to plain description string
    }
  }

  return {
    description: rawDescription,
    ownershipType: defaultOwnership,
    baselinePhotos: [],
    proofOfOwnershipUrl: null,
    intelTimeline: defaults,
  };
}

export function formatTimeAgo(dateInput?: Date | string | null): string {
  if (!dateInput) return "recently";

  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "recently";

  const now = Date.now();
  const diffMs = now - date.getTime();

  if (diffMs < 0) {
    const futureMin = Math.round(Math.abs(diffMs) / 60000);
    if (futureMin < 60) return `in ${futureMin}m`;
    const futureHours = Math.round(futureMin / 60);
    if (futureHours < 24) return `in ${futureHours}h`;
    const futureDays = Math.round(futureHours / 24);
    return `in ${futureDays}d`;
  }

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return "1min ago";
  if (minutes < 60) return `${minutes}mins ago`;

  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "1hr ago";
  if (hours < 24) return `${hours}hrs ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatAgentTitle(
  tier?: string | null,
  moduleType?: string | null
): string | null {
  if (tier) {
    switch (tier) {
      case "LEGAL_COUNSEL":
        return "esquire";
      case "TECHNICAL_SUPERVISOR":
        return "Engr";
      case "INVESTIGATOR":
        return "Investigator";
      case "ENFORCEMENT_LIAISON":
        return "Liaison";
      default:
        break;
    }
  }

  if (moduleType) {
    switch (moduleType) {
      case "LEGAL_ADVISORY":
        return "esquire";
      case "PROJECT_WATCH":
        return "Engr";
      case "DUE_DILIGENCE":
        return "Investigator";
      case "LAW_ENFORCEMENT":
        return "Liaison";
      case "PROPERTY_OVERSITE":
        return "Inspector";
      default:
        return null;
    }
  }

  return null;
}

export function formatAgentDisplayName(
  agentName?: string | null,
  agentTier?: string | null,
  moduleType?: string | null
): string {
  if (!agentName || !agentName.trim()) {
    return "Oversite Operations";
  }

  const name = agentName.trim();
  const title = formatAgentTitle(agentTier, moduleType);

  if (!title) {
    return name;
  }

  if (name.toLowerCase().includes(title.toLowerCase())) {
    return name;
  }

  return `${name} (${title})`;
}

export function getTaskStatusWeight(status: string): number {
  switch (status) {
    case "IN_PROGRESS":
      return 100;
    case "AGENT_ON_SITE":
      return 95;
    case "AGENT_EN_ROUTE":
      return 90;
    case "MATCHED":
      return 85;
    case "REPORT_SUBMITTED":
      return 80;
    case "UNDER_REVIEW":
      return 75;
    case "PENDING":
      return 70;
    case "DRAFT":
      return 50;
    case "COMPLETED":
      return 20;
    case "CANCELLED":
      return 5;
    case "DISPUTED":
      return 10;
    default:
      return 10;
  }
}

export function rankTasksForProperty(tasksList: RawTaskJoin[]): RawTaskJoin | null {
  if (!tasksList || tasksList.length === 0) return null;

  const now = Date.now();

  const sorted = [...tasksList].sort((a, b) => {
    const weightA = getTaskStatusWeight(a.status);
    const weightB = getTaskStatusWeight(b.status);

    const isActiveA = weightA >= 50;
    const isActiveB = weightB >= 50;

    if (isActiveA && !isActiveB) return -1;
    if (!isActiveA && isActiveB) return 1;

    if (isActiveA && isActiveB) {
      const deadlineA =
        a.clientPromisedDeliveryDate?.getTime() || a.scheduledAt?.getTime();
      const deadlineB =
        b.clientPromisedDeliveryDate?.getTime() || b.scheduledAt?.getTime();

      if (deadlineA && deadlineB) {
        const diffA = deadlineA - now;
        const diffB = deadlineB - now;

        if (diffA >= 0 && diffB >= 0) {
          if (diffA !== diffB) return diffA - diffB;
        } else if (diffA >= 0) {
          return -1;
        } else if (diffB >= 0) {
          return 1;
        }
      } else if (deadlineA && !deadlineB) {
        return -1;
      } else if (!deadlineA && deadlineB) {
        return 1;
      }

      if (weightA !== weightB) {
        return weightB - weightA;
      }

      const timeA = a.updatedAt?.getTime() || a.createdAt.getTime();
      const timeB = b.updatedAt?.getTime() || b.createdAt.getTime();
      return timeB - timeA;
    }

    const closeTimeA =
      a.completedAt?.getTime() || a.updatedAt?.getTime() || a.createdAt.getTime();
    const closeTimeB =
      b.completedAt?.getTime() || b.updatedAt?.getTime() || b.createdAt.getTime();
    return closeTimeB - closeTimeA;
  });

  return sorted[0];
}

export function buildPropertyCurrentTask(
  rawTask: RawTaskJoin
): PropertyCurrentTask {
  const agentDisplayName = formatAgentDisplayName(
    rawTask.agentName,
    rawTask.agentTier,
    rawTask.moduleType
  );

  const relevantDate =
    rawTask.status === "COMPLETED"
      ? rawTask.completedAt || rawTask.updatedAt
      : rawTask.updatedAt || rawTask.createdAt;

  const timeAgo = formatTimeAgo(relevantDate);
  const formattedDisplay = `${rawTask.title} • ${agentDisplayName} • ${timeAgo}`;

  return {
    id: rawTask.id,
    title: rawTask.title,
    moduleType: rawTask.moduleType as TaskModule,
    status: rawTask.status as TaskStatus,
    agentId: rawTask.agentId,
    agentName: rawTask.agentName,
    agentTitle: formatAgentTitle(rawTask.agentTier, rawTask.moduleType),
    agentDisplayName,
    createdAt: rawTask.createdAt.toISOString(),
    updatedAt: rawTask.updatedAt.toISOString(),
    scheduledAt: rawTask.scheduledAt?.toISOString() || null,
    completedAt: rawTask.completedAt?.toISOString() || null,
    clientPromisedDeliveryDate:
      rawTask.clientPromisedDeliveryDate?.toISOString() || null,
    timeAgo,
    formattedDisplay,
  };
}

export async function enrichPropertiesWithCurrentTasks(
  dbProperties: Array<any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any
): Promise<PropertyWithCurrentTask[]> {
  if (!dbProperties || dbProperties.length === 0) {
    return [];
  }

  const propertyIds = dbProperties.map((p) => p.id);

  const rawTasks = await db
    .select({
      id: tasks.id,
      propertyId: tasks.propertyId,
      title: tasks.title,
      moduleType: tasks.moduleType,
      status: tasks.status,
      agentId: tasks.agentId,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      scheduledAt: tasks.scheduledAt,
      completedAt: tasks.completedAt,
      clientPromisedDeliveryDate: tasks.clientPromisedDeliveryDate,
      agentName: users.name,
      agentRole: users.role,
      agentTier: agentProfiles.tier,
    })
    .from(tasks)
    .leftJoin(users, eq(tasks.agentId, users.id))
    .leftJoin(agentProfiles, eq(users.id, agentProfiles.userId))
    .where(inArray(tasks.propertyId, propertyIds));

  const tasksByProperty = new Map<string, RawTaskJoin[]>();
  for (const raw of rawTasks) {
    if (!raw.propertyId) continue;
    const existing = tasksByProperty.get(raw.propertyId) || [];
    existing.push(raw as RawTaskJoin);
    tasksByProperty.set(raw.propertyId, existing);
  }

  const enriched: PropertyWithCurrentTask[] = dbProperties.map((p) => {
    const propTasks = tasksByProperty.get(p.id) || [];
    const bestTask = rankTasksForProperty(propTasks);

    const activeTasks = propTasks.filter(
      (t) => getTaskStatusWeight(t.status) >= 50
    );

    const currentTask = bestTask ? buildPropertyCurrentTask(bestTask) : null;
    const meta = parsePropertyDescriptionMeta(p.description, p.parcelNumber);

    return {
      id: p.id,
      userId: p.userId,
      title: p.title,
      address: p.address,
      latitude: p.latitude ? parseFloat(p.latitude) : undefined,
      longitude: p.longitude ? parseFloat(p.longitude) : undefined,
      parcelNumber: p.parcelNumber || undefined,
      propertyType: p.propertyType || "Real Estate",
      description: meta.description,
      ownershipType: meta.ownershipType,
      baselinePhotos: meta.baselinePhotos,
      proofOfOwnershipUrl: meta.proofOfOwnershipUrl,
      intelTimeline: meta.intelTimeline,
      createdAt:
        p.createdAt instanceof Date
          ? p.createdAt.toISOString()
          : String(p.createdAt),
      updatedAt:
        p.updatedAt instanceof Date
          ? p.updatedAt.toISOString()
          : String(p.updatedAt),
      currentTask,
      activeTaskCount: activeTasks.length,
      totalTaskCount: propTasks.length,
    };
  });

  return enriched.sort((a, b) => {
    const hasActiveA = (a.activeTaskCount || 0) > 0 && a.currentTask;
    const hasActiveB = (b.activeTaskCount || 0) > 0 && b.currentTask;

    if (hasActiveA && !hasActiveB) return -1;
    if (!hasActiveA && hasActiveB) return 1;

    if (hasActiveA && hasActiveB && a.currentTask && b.currentTask) {
      const weightA = getTaskStatusWeight(a.currentTask.status);
      const weightB = getTaskStatusWeight(b.currentTask.status);
      if (weightA !== weightB) return weightB - weightA;

      const timeA = new Date(a.currentTask.updatedAt).getTime();
      const timeB = new Date(b.currentTask.updatedAt).getTime();
      return timeB - timeA;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
