import Redis from 'ioredis';

// Use environment variables for Redis connection
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('error', (error) => {
  console.error('Redis connection error:', error);
});

redis.on('ready', () => {
  console.log('Redis is ready');
});

export async function setTokenCache(key: string, value: string, ttlSeconds: number = 30): Promise<void> {
  try {
    await redis.setex(key, ttlSeconds, value);
    console.log(`Cached data for key: ${key} with TTL: ${ttlSeconds}s`);
  } catch (error) {
    console.error('Error setting cache:', error);
  }
}

export async function getTokenCache(key: string): Promise<string | null> {
  try {
    const value = await redis.get(key);
    if (value) {
      console.log(`Cache HIT for key: ${key}`);
    } else {
      console.log(`Cache MISS for key: ${key}`);
    }
    return value;
  } catch (error) {
    console.error('Error getting cache:', error);
    return null;
  }
}

export default redis; 