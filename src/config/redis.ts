// import Redis from "ioredis";
// import { env } from "./env";

// class RedisClient {
//   private client: Redis | null = null;
//   private isConnected: boolean = false;

//   async connect(): Promise<void> {
//     try {
//       // Use REDIS_URL if available (for services like Upstash)
//       // Otherwise use individual host/port/password
//       this.client = env.REDIS_URL
//         ? new Redis(env.REDIS_URL)
//         : new Redis({
//             host: env.REDIS_HOST,
//             port: env.REDIS_PORT,
//             password: env.REDIS_PASSWORD,
//             maxRetriesPerRequest: 3,
//             retryStrategy: (times) => {
//               if (times > 3) {
//                 console.error("Redis connection failed after 3 retries");
//                 return null;
//               }
//               return Math.min(times * 100, 3000);
//             },
//           });

//       this.client.on("connect", () => {
//         this.isConnected = true;
//         console.log("✅ Redis connected");
//       });

//       this.client.on("error", (err) => {
//         this.isConnected = false;
//         console.error("Redis error:", err);
//       });

//       this.client.on("close", () => {
//         this.isConnected = false;
//         console.log("Redis connection closed");
//       });

//       // Test connection
//       await this.client.ping();
//     } catch (error) {
//       console.error("Failed to connect to Redis:", error);
//       // Don't crash app if Redis is unavailable (graceful degradation)
//       this.client = null;
//     }
//   }

//   getClient(): Redis | null {
//     return this.client;
//   }

//   isReady(): boolean {
//     return this.isConnected && this.client !== null;
//   }

//   async disconnect(): Promise<void> {
//     if (this.client) {
//       await this.client.quit();
//       this.client = null;
//       this.isConnected = false;
//     }
//   }
// }

// export const redisClient = new RedisClient();

import { Redis } from "@upstash/redis";
import { env } from "./env";

class RedisClient {
  private client: Redis | null = null;

  async connect(): Promise<void> {
    try {
      // Parse REDIS_URL to extract credentials
      // Format: rediss://default:TOKEN@host:6379
      const url = new URL(env.REDIS_URL!);

      // REST API uses HTTPS (port 443) - works through any VPN/network
      this.client = new Redis({
        url: `https://${url.hostname}`,
        token: url.password, // Your token from REDIS_URL
      });

      // Test connection
      const result = await this.client.ping();
      console.log("✅ Redis connected via REST:", result);
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
      // Graceful degradation - app continues without cache
      this.client = null;
    }
  }

  getClient(): Redis | null {
    return this.client;
  }

  isReady(): boolean {
    return this.client !== null;
  }

  async disconnect(): Promise<void> {
    // REST client has no persistent connection to close
    this.client = null;
  }
}

export const redisClient = new RedisClient();
