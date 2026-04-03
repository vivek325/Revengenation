import { Redis } from "@upstash/redis";

let _redis: Redis | null = null;

/**
 * Returns the Upstash Redis client when credentials are configured,
 * or null so callers can gracefully fall back to Supabase.
 */
export function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token || !url.startsWith("https://")) {
    return null;
  }
  if (!_redis) {
    _redis = new Redis({ url, token });
  }
  return _redis;
}
