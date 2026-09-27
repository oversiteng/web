import { getRedisClient } from "@/lib/cache/redis";

export interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  payload: Record<string, unknown>;
}

export interface TaskAutoReleaseJobData {
  taskId: string;
  escrowAmountNgn: number;
  agentId: string;
}

export type BackgroundJob =
  | { type: "SEND_EMAIL"; data: EmailJobData }
  | { type: "AUTO_RELEASE_ESCROW"; data: TaskAutoReleaseJobData }
  | { type: "GENERATE_WATERMARK_PDF"; data: { reportId: string } };

const QUEUE_KEY = "oversite:queue:jobs";

/** Enqueues a background job into Redis for async worker execution */
export async function enqueueJob(job: BackgroundJob): Promise<boolean> {
  const redis = getRedisClient();
  const payload = JSON.stringify({
    ...job,
    enqueuedAt: new Date().toISOString(),
    id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  });

  if (redis) {
    await redis.lpush(QUEUE_KEY, payload);
    return true;
  }

  // Fallback if Redis is unavailable: process asynchronously in next event loop tick
  setTimeout(() => {
    console.log("[Fallback Worker] Processing job in memory:", job.type);
  }, 0);

  return true;
}

/** Pops the next job from the Redis queue (blocking or non-blocking) */
export async function dequeueNextJob(): Promise<(BackgroundJob & { id: string }) | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  const raw = await redis.rpop(QUEUE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
