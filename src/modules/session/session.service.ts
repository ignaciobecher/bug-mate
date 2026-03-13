import { Injectable, Logger } from '@nestjs/common';
import type { ConversationSession, ConversationState, FlowData } from './session.types';
import { ConfigLoaderService } from '../config/config-loader.service';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly sessions = new Map<string, ConversationSession>();

  constructor(private readonly configLoader: ConfigLoaderService) {
    // Clean up expired sessions every 5 minutes
    setInterval(() => this.cleanExpired(), 5 * 60 * 1000);
  }

  /**
   * Returns the session for a sender, creating a new one if it doesn't exist
   * or if the previous session has expired.
   */
  getOrCreate(senderId: string): { session: ConversationSession; isNew: boolean } {
    const existing = this.sessions.get(senderId);
    const timeoutMs = this.configLoader.botConfig.greeting.sessionTimeoutMinutes * 60 * 1000;

    if (existing) {
      const elapsed = Date.now() - existing.lastActivityAt.getTime();
      if (elapsed < timeoutMs) {
        existing.lastActivityAt = new Date();
        return { session: existing, isNew: false };
      }
      this.logger.debug(`Session expired for ${senderId}`);
    }

    const client = this.configLoader.findClient(senderId);
    const session: ConversationSession = {
      senderId,
      clientName: client?.name ?? this.configLoader.botConfig.greeting.unknownClientName,
      state: 'IDLE',
      flowStep: 0,
      flowData: {},
      history: [],
      lastActivityAt: new Date(),
    };

    this.sessions.set(senderId, session);
    this.logger.debug(`New session created for ${senderId} (${session.clientName})`);
    return { session, isNew: true };
  }

  setState(senderId: string, state: ConversationState): void {
    const session = this.sessions.get(senderId);
    if (session) {
      session.state = state;
      session.flowStep = 0;
      session.flowData = {};
    }
  }

  advanceFlowStep(senderId: string, key: string, value: string): void {
    const session = this.sessions.get(senderId);
    if (session) {
      session.flowData[key] = value;
      session.flowStep++;
    }
  }

  setFlowData(senderId: string, data: Partial<FlowData>): void {
    const session = this.sessions.get(senderId);
    if (session) {
      session.flowData = { ...session.flowData, ...(data as Record<string, string>) };
    }
  }

  addToHistory(senderId: string, role: 'user' | 'assistant', content: string): void {
    const session = this.sessions.get(senderId);
    if (!session) return;

    const maxHistory = this.configLoader.botConfig.ai.maxHistoryMessages;
    session.history.push({ role, content });

    if (session.history.length > maxHistory * 2) {
      session.history = session.history.slice(-maxHistory * 2);
    }
  }

  reset(senderId: string): void {
    const session = this.sessions.get(senderId);
    if (session) {
      session.state = 'IDLE';
      session.flowStep = 0;
      session.flowData = {};
    }
  }

  private cleanExpired(): void {
    const timeoutMs = this.configLoader.botConfig.greeting.sessionTimeoutMinutes * 60 * 1000;
    const now = Date.now();
    let removed = 0;

    for (const [id, session] of this.sessions.entries()) {
      if (now - session.lastActivityAt.getTime() > timeoutMs) {
        this.sessions.delete(id);
        removed++;
      }
    }

    if (removed > 0) {
      this.logger.debug(`Cleaned ${removed} expired sessions`);
    }
  }
}
