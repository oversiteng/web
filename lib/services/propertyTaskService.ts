import { eq, inArray } from "drizzle-orm";
import { tasks, users, agentProfiles, properties } from "@/db/schema";
import {
  Property,
  PropertyCurrentTask,
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

/**
 * Converts a date into human-readable relative time (e.g., "30mins ago", "3hrs ago", "yesterday")
 */
export function formatTimeAgo(dateInput?: Date | string | null): string {
  if (!dateInput) return "recently";

  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "recently";

  const now = Date.now();
  const diffMs = now - date.getTime();

  // If in future (e.g. scheduled date)
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

/**
 * Returns professional title/designation based on agent tier and service module
 * e.g., "esquire" for legal counsel, "Engr" for technical supervisor, "Investigator" for due diligence
 */
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

  // Fallback to domain-specific professional title from task module type
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

/**
 * Formats agent display name according to Oversite standards
 * Examples: "Agent A", "Agent B (esquire)", "Folake A. (Engr)"
 */
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

  // Avoid duplicate title if already present in user name
  if (name.toLowerCase().includes(title.toLowerCase())) {
    return name;
  }

  return `${name} (${title})`;
}

/**
 * Status priority weighting for determining which task is "active" or most urgent
 */
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

/**
 * Sorting Algorithm:
 * Selects the current task that is being done or linked to the property,
 * prioritizing active tasks, closest deadline / end date, and most recent activity.
 */
export function rankTasksForProperty(tasksList: RawTaskJoin[]): RawTaskJoin | null {
  if (!tasksList || tasksList.length === 0) return null;

  const now = Date.now();

  const sorted = [...tasksList].sort((a, b) => {
    const weightA = getTaskStatusWeight(a.status);
    const weightB = getTaskStatusWeight(b.status);

    const isActiveA = weightA >= 50;
    const isActiveB = weightB >= 50;

    // 1. Active tasks always take priority over closed/completed tasks
    if (isActiveA && !isActiveB) return -1;
    if (!isActiveA && isActiveB) return 1;

    // 2. Both are active: Check closest to end date / promised delivery date
    if (isActiveA && isActiveB) {
      const deadlineA =
        a.clientPromisedDeliveryDate?.getTime() || a.scheduledAt?.getTime();
      const deadlineB =
        b.clientPromisedDeliveryDate?.getTime() || b.scheduledAt?.getTime();

      // If both have deadlines
      if (deadlineA && deadlineB) {
        const diffA = deadlineA - now;
        const diffB = deadlineB - now;

        // Both in future: closest upcoming deadline wins
        if (diffA >= 0 && diffB >= 0) {
          if (diffA !== diffB) return diffA - diffB;
        } else if (diffA >= 0) {
          return -1; // A is pending upcoming deadline
        } else if (diffB >= 0) {
          return 1; // B is pending upcoming deadline
        }
      } else if (deadlineA && !deadlineB) {
        return -1;
      } else if (!deadlineA && deadlineB) {
        return 1;
      }

      // If weight differs between active statuses (e.g. IN_PROGRESS vs PENDING)
      if (weightA !== weightB) {
        return weightB - weightA;
      }

      // Otherwise, most recently updated / created wins
      const timeA = a.updatedAt?.getTime() || a.createdAt.getTime();
      const timeB = b.updatedAt?.getTime() || b.createdAt.getTime();
      return timeB - timeA;
    }

    // 3. Both are inactive (e.g. COMPLETED): Most recently completed/updated wins
    const closeTimeA =
      a.completedAt?.getTime() || a.updatedAt?.getTime() || a.createdAt.getTime();
    const closeTimeB =
      b.completedAt?.getTime() || b.updatedAt?.getTime() || b.createdAt.getTime();
    return closeTimeB - closeTimeA;
  });

  return sorted[0];
}

/**
 * Maps a raw joined task record to the structured PropertyCurrentTask interface
 */
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

  // Example: "CAC request • Agent A • 30mins ago"
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

/**
 * Batch-enriches a list of database property records with their current active/recent task
 * and orders the properties list by task urgency & recency.
 */
export async function enrichPropertiesWithCurrentTasks(
  dbProperties: Array<any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any
): Promise<PropertyWithCurrentTask[]> {
  if (!dbProperties || dbProperties.length === 0) {
    return [];
  }

  const propertyIds = dbProperties.map((p) => p.id);

  // 1. Fetch all tasks linked to any of these properties, joining agent info
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

  // 2. Group tasks by propertyId
  const tasksByProperty = new Map<string, RawTaskJoin[]>();
  for (const raw of rawTasks) {
    if (!raw.propertyId) continue;
    const existing = tasksByProperty.get(raw.propertyId) || [];
    existing.push(raw as RawTaskJoin);
    tasksByProperty.set(raw.propertyId, existing);
  }

  // 3. For each property, calculate currentTask, activeTaskCount, totalTaskCount
  const enriched: PropertyWithCurrentTask[] = dbProperties.map((p) => {
    const propTasks = tasksByProperty.get(p.id) || [];
    const bestTask = rankTasksForProperty(propTasks);

    const activeTasks = propTasks.filter(
      (t) => getTaskStatusWeight(t.status) >= 50
    );

    const currentTask = bestTask ? buildPropertyCurrentTask(bestTask) : null;

    return {
      id: p.id,
      userId: p.userId,
      title: p.title,
      address: p.address,
      latitude: p.latitude ? parseFloat(p.latitude) : undefined,
      longitude: p.longitude ? parseFloat(p.longitude) : undefined,
      parcelNumber: p.parcelNumber || undefined,
      propertyType: p.propertyType || "Real Estate",
      description: p.description || undefined,
      createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
      updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : String(p.updatedAt),
      currentTask,
      activeTaskCount: activeTasks.length,
      totalTaskCount: propTasks.length,
    };
  });

  // 4. Sort properties:
  // Properties with active tasks sorted by urgency/recency first;
  // Properties without active tasks sorted by createdAt DESC next.
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

    // Neither has active tasks: sort by property creation date
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
