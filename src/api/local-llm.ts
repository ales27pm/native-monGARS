import { coreMLService } from './core-ml-service';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  title: string;
  createdAt: number;
  updatedAt: number;
}

class LocalLLMService {
  private currentSession: ChatSession | null = null;
  private sessions: Map<string, ChatSession> = new Map();

  async createNewSession(title?: string): Promise<ChatSession> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session: ChatSession = {
      id: sessionId,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant running locally on the user\'s device. All conversations are private and secure.',
          timestamp: Date.now()
        }
      ],
      title: title || 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.sessions.set(sessionId, session);
    this.currentSession = session;
    return session;
  }

  getCurrentSession(): ChatSession | null {
    return this.currentSession;
  }

  getAllSessions(): ChatSession[] {
    return Array.from(this.sessions.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async switchToSession(sessionId: string): Promise<ChatSession> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    this.currentSession = session;
    return session;
  }

  async sendMessage(content: string): Promise<ChatMessage> {
    if (!this.currentSession) {
      await this.createNewSession();
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content,
      timestamp: Date.now()
    };

    this.currentSession!.messages.push(userMessage);
    
    // Generate AI response using Core ML
    const responseContent = await coreMLService.generateResponse(content);
    
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: responseContent,
      timestamp: Date.now()
    };

    this.currentSession!.messages.push(assistantMessage);
    this.currentSession!.updatedAt = Date.now();
    
    // Update session title if it's the first user message
    if (this.currentSession!.messages.filter(m => m.role === 'user').length === 1) {
      this.currentSession!.title = content.substring(0, 50) + (content.length > 50 ? '...' : '');
    }

    this.sessions.set(this.currentSession!.id, this.currentSession!);
    
    return assistantMessage;
  }

  async deleteSession(sessionId: string): Promise<void> {
    if (this.currentSession?.id === sessionId) {
      this.currentSession = null;
    }
    this.sessions.delete(sessionId);
  }

  async clearAllSessions(): Promise<void> {
    this.sessions.clear();
    this.currentSession = null;
  }

  getMessageHistory(sessionId?: string): ChatMessage[] {
    const session = sessionId ? this.sessions.get(sessionId) : this.currentSession;
    return session?.messages.filter(m => m.role !== 'system') || [];
  }

  async exportSession(sessionId: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const exportData = {
      session,
      exportedAt: new Date().toISOString(),
      modelInfo: coreMLService.getActiveModel()
    };

    return JSON.stringify(exportData, null, 2);
  }

  getStats(): {
    totalSessions: number;
    totalMessages: number;
    activeModel: string;
    storageUsed: string;
  } {
    const totalMessages = Array.from(this.sessions.values())
      .reduce((total, session) => total + session.messages.length, 0);
    
    const activeModel = coreMLService.getActiveModel();
    const storageInfo = coreMLService.getStorageInfo();

    return {
      totalSessions: this.sessions.size,
      totalMessages,
      activeModel: activeModel?.name || 'No model active',
      storageUsed: storageInfo.totalUsed
    };
  }
}

export const localLLMService = new LocalLLMService();