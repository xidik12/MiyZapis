import { BotSession, Language } from '../types';

// Simple in-memory session storage for development
// In production, use Redis or database
class SessionManager {
  private sessions: Map<number, BotSession> = new Map();

  async getSession(userId: number): Promise<BotSession | null> {
    const session = this.sessions.get(userId);
    if (!session) return null;

    // Check if session is expired (24 hours)
    const now = new Date();
    const sessionAge = now.getTime() - session.lastActivity.getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (sessionAge > maxAge) {
      this.sessions.delete(userId);
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

    this.sessions.set(userId, session);
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

    this.sessions.set(userId, updatedSession);
    return updatedSession;
  }

  async deleteSession(userId: number): Promise<void> {
    this.sessions.delete(userId);
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
    return this.sessions.size;
  }

  async cleanupExpiredSessions(): Promise<number> {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    let cleanedCount = 0;

    for (const [userId, session] of this.sessions.entries()) {
      const sessionAge = now.getTime() - session.lastActivity.getTime();
      if (sessionAge > maxAge) {
        this.sessions.delete(userId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  // Helper methods for common session operations
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
}

export const sessionManager = new SessionManager();
export default sessionManager;