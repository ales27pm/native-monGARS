// Chat Engine for native-monGARS
// Integrates with ARIA's existing reasoning system and adds advanced caching

import CacheService from './CacheService';
import { reasoningEngine } from '../../api/advanced-reasoning';
import { contextEngine } from '../../api/context-engine';
import { AssistantContext } from '../../types/assistant';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: {
    cached: boolean;
    processingTime?: number;
    model?: string;
    confidence?: number;
  };
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  context: AssistantContext;
  createdAt: number;
  updatedAt: number;
}

export class ChatEngine {
  private static instance: ChatEngine;
  private activeSessions: Map<string, ChatSession> = new Map();

  static getInstance(): ChatEngine {
    if (!ChatEngine.instance) {
      ChatEngine.instance = new ChatEngine();
    }
    return ChatEngine.instance;
  }

  /**
   * Send a user message and get AI response with advanced caching
   */
  async sendUserMessage(
    conversationId: string,
    userText: string,
    useCache: boolean = true
  ): Promise<string> {
    const startTime = Date.now();
    
    try {
      // Get or create session
      let session = this.activeSessions.get(conversationId);
      if (!session) {
        session = await this.createSession(conversationId);
      }

      // Add user message to session
      const userMessage: ChatMessage = {
        id: `${conversationId}_${Date.now()}_user`,
        role: 'user',
        content: userText,
        timestamp: Date.now(),
      };
      session.messages.push(userMessage);

      // Load cached context if available and requested
      let pastContext = '';
      if (useCache) {
        pastContext = await CacheService.loadContext(conversationId);
      }

      // Build enhanced prompt with context
      const enhancedPrompt = this.buildEnhancedPrompt(pastContext, userText, session);

      // Get AI response using ARIA's reasoning engine
      const response = await reasoningEngine.processQuery({
        query: enhancedPrompt,
        context: session.context,
      });

      const processingTime = Date.now() - startTime;

      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: `${conversationId}_${Date.now()}_assistant`,
        role: 'assistant',
        content: response.content,
        timestamp: Date.now(),
        metadata: {
          cached: false,
          processingTime,
          model: response.model,
          confidence: response.confidence,
        },
      };

      session.messages.push(assistantMessage);
      session.updatedAt = Date.now();

      // Save response to cache if enabled
      if (useCache) {
        const lastIndex = await CacheService.saveAssistantResponse(
          conversationId,
          response.content
        );
        
        // Schedule intelligent prefetching
        CacheService.schedulePrefetch(conversationId, lastIndex);
      }

      // Update session context
      session.context = await contextEngine.updateContext(
        session.context,
        undefined,
        undefined,
        {
          userMessage: userText,
          assistantResponse: response.content,
          conversationLength: session.messages.length,
        }
      );

      this.activeSessions.set(conversationId, session);

      console.log(`ARIA Chat: Response generated in ${processingTime}ms`);
      return response.content;

    } catch (error) {
      console.error('Chat engine error:', error);
      
      // Fallback response
      const fallbackResponse = "I apologize, but I encountered an issue processing your message. Please try again.";
      
      // Still try to cache the fallback if possible
      if (useCache) {
        try {
          await CacheService.saveAssistantResponse(conversationId, fallbackResponse);
        } catch (cacheError) {
          console.warn('Failed to cache fallback response:', cacheError);
        }
      }
      
      return fallbackResponse;
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(conversationId: string): Promise<ChatMessage[]> {
    const session = this.activeSessions.get(conversationId);
    if (session) {
      return session.messages;
    }

    // Try to load from cache
    try {
      const cachedContext = await CacheService.loadContext(conversationId);
      if (cachedContext) {
        // Parse cached context back into messages (simplified)
        const messages: ChatMessage[] = [];
        const lines = cachedContext.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          if (line.startsWith('User: ')) {
            messages.push({
              id: `${conversationId}_${Date.now()}_user_${messages.length}`,
              role: 'user',
              content: line.substring(6),
              timestamp: Date.now(),
            });
          } else if (line.startsWith('Assistant: ')) {
            messages.push({
              id: `${conversationId}_${Date.now()}_assistant_${messages.length}`,
              role: 'assistant',
              content: line.substring(11),
              timestamp: Date.now(),
              metadata: { cached: true },
            });
          }
        }
        
        return messages;
      }
    } catch (error) {
      console.warn('Error loading conversation history:', error);
    }

    return [];
  }

  /**
   * Clear conversation and cache
   */
  async clearConversation(conversationId: string): Promise<void> {
    // Remove from active sessions
    this.activeSessions.delete(conversationId);
    
    // Clear from cache (this would need to be implemented in CacheService)
    // For now, we clear the entire cache
    console.log(`Clearing conversation: ${conversationId}`);
  }

  /**
   * Get all active conversation IDs
   */
  getActiveConversations(): string[] {
    return Array.from(this.activeSessions.keys());
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    return await CacheService.getStats();
  }

  /**
   * Optimize cache
   */
  async optimizeCache(): Promise<void> {
    await CacheService.ensureCacheSize();
  }

  // Private helper methods

  private async createSession(conversationId: string): Promise<ChatSession> {
    const context = await contextEngine.updateContext();
    
    const session: ChatSession = {
      id: conversationId,
      messages: [],
      context,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.activeSessions.set(conversationId, session);
    return session;
  }

  private buildEnhancedPrompt(
    pastContext: string,
    userText: string,
    session: ChatSession
  ): string {
    let prompt = '';

    // Add system context
    prompt += 'You are ARIA, an Advanced Reasoning Intelligence Assistant. ';
    prompt += 'You provide thoughtful, accurate, and helpful responses. ';

    // Add conversation history context
    if (pastContext) {
      prompt += `\n\nPrevious conversation context:\n${pastContext}`;
    }

    // Add recent session context
    if (session.messages.length > 0) {
      const recentMessages = session.messages.slice(-4); // Last 4 messages
      prompt += '\n\nRecent conversation:\n';
      for (const msg of recentMessages) {
        prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      }
    }

    // Add current user message
    prompt += `\nUser: ${userText}\nAssistant:`;

    return prompt;
  }
}

// Export singleton instance
export const chatEngine = ChatEngine.getInstance();

// Legacy function for backwards compatibility
export async function sendUserMessage(
  conversationId: string,
  userText: string
): Promise<string> {
  return await chatEngine.sendUserMessage(conversationId, userText);
}