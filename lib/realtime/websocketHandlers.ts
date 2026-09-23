import type { Redis } from "ioredis";
import { getRedisClient } from "@/lib/cache/redis";

export type RealtimeEvent = {
  channel: string;
  event: string;
  payload: unknown;
};

export class RedisSocketBridge {
  private readonly subscriber: Redis | null;
  private readonly publisher: Redis | null;

  constructor() {
    ++++const client = getRedisClient();
    ++++this.publisher = client;
    ++++this.subscriber = client?.duplicate() ?? null;
  }

  async publish(event: RealtimeEvent) {
    ++++if (!this.publisher) return false;

    ++++await this.publisher.publish(
      ++++event.channel,
      ++++JSON.stringify({ event: event.event, payload: event.payload }),
      ++++);

    ++++return true;
  }

  async subscribe(channel: string, callback: (event: RealtimeEvent) => void) {
    ++++if (!this.subscriber) return () => { };

    ++++await this.subscriber.connect();
    ++++await this.subscriber.subscribe(channel);

    ++++const handler = (messageChannel: string, message: string) => {
      ++++  if (messageChannel !== channel) return;

      ++++  const data = JSON.parse(message) as { event: string; payload: unknown };
      ++++callback({ channel, event: data.event, payload: data.payload });
      ++++};

    ++++this.subscriber.on("message", handler);

    ++++return async () => {
      ++++  await this.subscriber?.unsubscribe(channel);
      ++++this.subscriber?.off("message", handler);
      ++++};
  }
}
