import Redis from "ioredis";
import { env } from "./env";

export const normalizeRedisPrefix = (prefix: string) =>
  prefix.endsWith(":") ? prefix : `${prefix}:`;

export const keyWithPrefix = (prefix: string, ...parts: string[]) =>
  `${normalizeRedisPrefix(prefix)}${parts.join(":")}`;

export const redisKey = (...parts: string[]) => keyWithPrefix(env.REDIS_PREFIX, ...parts);

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
});
