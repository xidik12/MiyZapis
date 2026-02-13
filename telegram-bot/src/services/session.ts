import Redis from 'ioredis';
import { BotSession, Language } from '../types';

const SESSION_PREFIX = 'bot:session:';
const SESSION_TTL = 24 * 60 * 60; // 24 hours in seconds

class SessionManager {
  private redis: Redis | null = null;
  private fallbackMap: Map<number, BotSession> = new Map();
  private useRedis = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => {
            if (times > 5) {
              console.warn('[Session] Redis retry limit reached, falling back to in-memory');
              this.useRedis = false;
              return null;
            }
            return Math.min(times * 200, 2000);
          },
          lazyConnect: true,
        });

        this.redis.connect()
          .then(() => {
            this.useRedis = true;
            console.log('[Session] Connected to Redis');
          })
          .catch((err) => {
            console.warn('[Session] Redis connection failed, using in-memory fallback:', err.message);
            this.useRedis = false;
          });

        this.redis.on('error', () => {
          if (this.useRedis) {
            console.warn('[Session] Redis error, falling back to in-memory');
            this.useRedis = false;
          }
        });

        this.redis.on('ready', () => {
          if (!this.useRedis) {
            console.log('[Session] Redis reconnected');
            this.useRedis = true;
          }
        });
      } catch {
        console.warn('[Session] Failed to initialize Redis, using in-memory');
      }
    }
  }

  private sessionKey(userId: number): string {
    return `${SESSION_PREFIX}${userId}`;
  }

  private serialize(session: BotSession): string {
    return JSON.stringify({
      ...session,
      lastActivity: session.lastActivity.toISOString(),
    });
  }

  private deserialize(json: string): BotSession {
    const parsed = JSON.parse(json);
    return {
      ...parsed,
      lastActivity: new Date(parsed.lastActivity),
    };
  }

  async getSession(userId: number): Promise<BotSession | null> {
    if (this.useRedis && this.redis) {
      try {
        const data = await this.redis.get(this.sessionKey(userId));
        if (!data) return null;
        return this.deserialize(data);
      } catch {
        // Fall through to in-memory
      }
    }

    const session = this.fallbackMap.get(userId);
    if (!session) return null;

    const now = new Date();
    const sessionAge = now.getTime() - session.lastActivity.getTime();
    if (sessionAge > SESSION_TTL * 1000) {
      this.fallbackMap.delete(userId);
      return null;
    }

    return session;
  }

  async createSession(userId: number, language: Language = 'en'): Promise<BotSession> {
    const session: BotSession = {
      userId,
      language,
      lastActivity: new Date(),
    };

    if (this.useRedis && this.redis) {
      try {
        await this.redis.set(this.sessionKey(userId), this.serialize(session), 'EX', SESSION_TTL);
        return session;
      } catch {
        // Fall through to in-memory
      }
    }

    this.fallbackMap.set(userId, session);
    return session;
  }

  async updateSession(userId: number, updates: Partial<BotSession>): Promise<BotSession | null> {
    const session = await this.getSession(userId);
    if (!session) return null;

    const updatedSession = {
      ...session,
      ...updates,
      lastActivity: new Date(),
    };

    if (this.useRedis && this.redis) {
      try {
        await this.redis.set(this.sessionKey(userId), this.serialize(updatedSession), 'EX', SESSION_TTL);
        return updatedSession;
      } catch {
        // Fall through to in-memory
      }
    }

    this.fallbackMap.set(userId, updatedSession);
    return updatedSession;
  }

  async deleteSession(userId: number): Promise<void> {
    if (this.useRedis && this.redis) {
      try {
        await this.redis.del(this.sessionKey(userId));
      } catch {
        // Fall through
      }
    }
    this.fallbackMap.delete(userId);
  }

  async setSessionData(userId: number, key: string, value: any): Promise<void> {
    const session = await this.getSession(userId);
    if (!session) return;

    if (!session.data) {
      session.data = {};
    }

    session.data[key] = value;
    await this.updateSession(userId, { data: session.data });
  }

  async getSessionData(userId: number, key: string): Promise<any> {
    const session = await this.getSession(userId);
    return session?.data?.[key];
  }

  async clearSessionData(userId: number): Promise<void> {
    await this.updateSession(userId, { data: {}, currentFlow: undefined, currentStep: undefined });
  }

  async setFlow(userId: number, flow: string, step?: string): Promise<void> {
    await this.updateSession(userId, { currentFlow: flow, currentStep: step });
  }

  async clearFlow(userId: number): Promise<void> {
    await this.updateSession(userId, { currentFlow: undefined, currentStep: undefined });
  }

  async getActiveSessionsCount(): Promise<number> {
    if (this.useRedis && this.redis) {
      try {
        const keys = await this.redis.keys(`${SESSION_PREFIX}*`);
        return keys.length;
      } catch {
        // Fall through
      }
    }
    return this.fallbackMap.size;
  }

  async cleanupExpiredSessions(): Promise<number> {
    // Redis handles TTL-based expiry automatically
    if (this.useRedis) return 0;

    const now = new Date();
    let cleanedCount = 0;

    for (const [userId, session] of this.fallbackMap.entries()) {
      const sessionAge = now.getTime() - session.lastActivity.getTime();
      if (sessionAge > SESSION_TTL * 1000) {
        this.fallbackMap.delete(userId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  async getUserLanguage(userId: number): Promise<Language> {
    const session = await this.getSession(userId);
    return session?.language || 'en';
  }

  async setUserLanguage(userId: number, language: Language): Promise<void> {
    await this.updateSession(userId, { language });
  }

  async getCurrentFlow(userId: number): Promise<{ flow?: string; step?: string }> {
    const session = await this.getSession(userId);
    return {
      flow: session?.currentFlow,
      step: session?.currentStep
    };
  }

  async isInFlow(userId: number, flowName: string): Promise<boolean> {
    const session = await this.getSession(userId);
    return session?.currentFlow === flowName;
  }

  async getBookingFlow(userId: number): Promise<any> {
    return await this.getSessionData(userId, 'bookingFlow');
  }

  async updateBookingFlow(userId: number, data: any): Promise<void> {
    const currentFlow = await this.getBookingFlow(userId) || {};
    const updatedFlow = { ...currentFlow, ...data };
    await this.setSessionData(userId, 'bookingFlow', updatedFlow);
  }

  async clearBookingFlow(userId: number): Promise<void> {
    await this.setSessionData(userId, 'bookingFlow', null);
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
      this.useRedis = false;
    }
  }
}

export const sessionManager = new SessionManager();
export default sessionManager;
