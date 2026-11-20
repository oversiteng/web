import Redis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var __redisClient: Redis | undefined;
}

export function getRedisClient(): Redis | null {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  if (!globalThis.__redisClient) {
    globalThis.__redisClient = new Redis(redisUrl, {
      family: 4,
      maxRetriesPerRequest: null,
      enableOfflineQueue: true,
      retryStrategy(times) {
        const delay = Math.min(times * 200, 3000);
        return delay;
      },
    });

    globalThis.__redisClient.on("error", (err) => {
      console.warn("[Redis Connection Warning]:", err.message);
    });
  }

  return globalThis.__redisClient;
}
