import { EventEmitter } from "node:events";
import type { Redis } from "ioredis";
import { getRedisClient } from "@/lib/cache/redis";

export type RealtimeEvent = {
  channel: string;
  event: string;
  payload: unknown;
};

// Global memory emitter for dev & non-Redis fallback
const localEmitter = new EventEmitter();
localEmitter.setMaxListeners(200);

export class RedisSocketBridge {
  private readonly subscriber: Redis | null;
  private readonly publisher: Redis | null;
  private readonly channelRefCounts = new Map<string, number>();

  constructor() {
    const client = getRedisClient();
    this.publisher = client;
    this.subscriber = client ? client.duplicate() : null;
    this.subscriber?.setMaxListeners(200);
  }

  async publish(event: RealtimeEvent): Promise<boolean> {
    if (this.publisher) {
      try {
        await this.publisher.publish(
          event.channel,
          JSON.stringify({ event: event.event, payload: event.payload })
        );
        return true;
      } catch (err) {
        console.error("[Realtime] Redis publish error, falling back to local emitter:", err);
      }
    }

    // Fallback to local process memory emitter only when Redis is unavailable
    localEmitter.emit(event.channel, event);
    return true;
  }

  async subscribe(
    channel: string,
    callback: (event: RealtimeEvent) => void
  ): Promise<() => Promise<void> | void> {
    // Local fallback listener (fires only if publisher fell back to localEmitter)
    const localListener = (event: RealtimeEvent) => {
      callback(event);
    };
    localEmitter.on(channel, localListener);

    if (!this.subscriber) {
      return () => {
        localEmitter.off(channel, localListener);
      };
    }

    try {
      const currentCount = this.channelRefCounts.get(channel) || 0;
      this.channelRefCounts.set(channel, currentCount + 1);
      if (currentCount === 0) {
        await this.subscriber.subscribe(channel);
      }

      const redisHandler = (messageChannel: string, message: string) => {
        if (messageChannel !== channel) return;
        try {
          const data = JSON.parse(message) as { event: string; payload: unknown };
          callback({ channel, event: data.event, payload: data.payload });
        } catch {
          // Ignore malformed payloads
        }
      };

      this.subscriber.on("message", redisHandler);

      let cleanedUp = false;
      return async () => {
        if (cleanedUp) return;
        cleanedUp = true;

        localEmitter.off(channel, localListener);
        this.subscriber?.off("message", redisHandler);

        const nextCount = (this.channelRefCounts.get(channel) || 1) - 1;
        if (nextCount <= 0) {
          this.channelRefCounts.delete(channel);
          try {
            await this.subscriber?.unsubscribe(channel);
          } catch {}
        } else {
          this.channelRefCounts.set(channel, nextCount);
        }
      };
    } catch {
      return () => {
        localEmitter.off(channel, localListener);
      };
    }
  }
}

export const realtimeBridge = new RedisSocketBridge();
