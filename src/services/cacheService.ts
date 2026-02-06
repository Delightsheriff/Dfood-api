import { redisClient } from "../config/redis";

export class CacheService {
  private defaultTTL = 3600; // 1 hour in seconds

  /**
   * Get cached data
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const client = redisClient.getClient();
      if (!client || !redisClient.isReady()) {
        return null; // Graceful degradation
      }

      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Cache GET error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached data with optional TTL
   */
  async set(
    key: string,
    value: any,
    ttl: number = this.defaultTTL,
  ): Promise<void> {
    try {
      const client = redisClient.getClient();
      if (!client || !redisClient.isReady()) {
        return; // Graceful degradation
      }

      await client.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error(`Cache SET error for key ${key}:`, error);
    }
  }

  /**
   * Delete cached data
   */
  async delete(key: string): Promise<void> {
    try {
      const client = redisClient.getClient();
      if (!client || !redisClient.isReady()) {
        return;
      }

      await client.del(key);
    } catch (error) {
      console.error(`Cache DELETE error for key ${key}:`, error);
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      const client = redisClient.getClient();
      if (!client || !redisClient.isReady()) {
        return;
      }

      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } catch (error) {
      console.error(
        `Cache DELETE PATTERN error for pattern ${pattern}:`,
        error,
      );
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const client = redisClient.getClient();
      if (!client || !redisClient.isReady()) {
        return false;
      }

      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get or set pattern (fetch from cache, or compute and cache)
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = this.defaultTTL,
  ): Promise<T> {
    // Try cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - fetch data
    const data = await fetchFn();
    await this.set(key, data, ttl);
    return data;
  }
}

export const cacheService = new CacheService();
