import Redis from 'ioredis';
import { env } from './env';

let redis: Redis | null = null;

try {
  if (env.REDIS_URL) {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redis.on('error', (err) => {
      console.warn('Redis connection error (non-fatal):', err.message);
    });
  } else {
    console.warn('Redis URL not configured, running without cache');
  }
} catch {
  console.warn('Redis unavailable, running without cache');
}

export { redis };
