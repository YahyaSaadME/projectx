import { createClient } from "redis";

type RedisClient = ReturnType<typeof createClient>;

declare global {
  // eslint-disable-next-line no-var
  var _redisClientPromise: Promise<RedisClient | null> | undefined;
}

function getRedisUrl() {
  return process.env.REDIS_URL;
}

export async function getRedisClient() {
  const redisUrl = getRedisUrl();

  if (!redisUrl) {
    return null;
  }

  if (!global._redisClientPromise) {
    const client = createClient({ url: redisUrl });
    client.on("error", (error) => {
      console.error("Redis client error", error);
    });

    global._redisClientPromise = client
      .connect()
      .then(() => client)
      .catch((error) => {
        console.error("Redis connection failed", error);
        return null;
      });
  }

  return global._redisClientPromise;
}

export async function readRedisValue<T>(key: string): Promise<T | null> {
  const client = await getRedisClient();

  if (!client) {
    return null;
  }

  const value = await client.get(key);
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function writeRedisValue(key: string, value: unknown, ttlSeconds: number) {
  const client = await getRedisClient();

  if (!client) {
    return;
  }

  await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
}

export async function deleteRedisValue(key: string) {
  const client = await getRedisClient();

  if (!client) {
    return;
  }

  await client.del(key);
}
