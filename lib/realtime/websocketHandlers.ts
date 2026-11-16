import { EventEmitter } from "node:events";
import type { Redis } from "ioredis";
import { getRedisClient } from "@/lib/cache/redis";

export type RealtimeEvent = {
  channel: string;
  event: string;
  payload: unknown;
};

// Global memory emitter for dev & cluster fallback
const localEmitter = new EventEmitter();
localEmitter.setMaxListeners(100);

export class RedisSocketBridge {
  private readonly subscriber: Redis | null;
  private readonly publisher: Redis | null;

  constructor() {
    const client = getRedisClient();
    this.publisher = client;
    this.subscriber = client ? client.duplicate() : null;
  }

  async publish(event: RealtimeEvent): Promise<boolean> {
    // Always emit on local process memory emitter
    localEmitter.emit(event.channel, event);

    if (!this.publisher) return true;

    try {
      await this.publisher.publish(
        event.channel,
        JSON.stringify({ event: event.event, payload: event.payload })
      );
      return true;
    } catch (err) {
      console.error("[Realtime] Redis publish error:", err);
      return false;
    }
  }

  async subscribe(
    channel: string,
    callback: (event: RealtimeEvent) => void
  ): Promise<() => Promise<void> | void> {
    // Local listener
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
      await this.subscriber.subscribe(channel);

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

      return async () => {
        localEmitter.off(channel, localListener);
        try {
          await this.subscriber?.unsubscribe(channel);
          this.subscriber?.off("message", redisHandler);
        } catch {}
      };
    } catch {
      return () => {
        localEmitter.off(channel, localListener);
      };
    }
  }
}

export const realtimeBridge = new RedisSocketBridge();
