import { AssistantMessage } from '../types/core';
import { AIMessage } from '../types/ai';
import { MemoryService } from './MemoryService';
import { AuditService } from './AuditService';
import ResilientLLMService from './LLMProvider';
import FeatureFlagService, { FeatureFlags } from './FeatureFlagService';
import * as Speech from 'expo-speech';

export class AssistantService {
  private static instance: AssistantService;
  private memoryService = MemoryService.getInstance();
  private auditService = AuditService.getInstance();

  public static getInstance(): AssistantService {
    if (!AssistantService.instance) {
      AssistantService.instance = new AssistantService();
    }
    return AssistantService.instance;
  }

  private constructor() {}

  async generateResponse(
    messages: AssistantMessage[],
    onToken?: (token: string) => void,
    onComplete?: (fullResponse: string) => void
  ): Promise<string> {
    try {
      // Convert messages to AI format
      const aiMessages: AIMessage[] = messages.map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.content
      }));

      // Add context from memory if enabled
      if (FeatureFlagService.getInstance().isEnabled(FeatureFlags.CONTEXT_MEMORY)) {
        const recentMemories = await this.memoryService.getMemories(undefined, 5);
        if (recentMemories.length > 0) {
          const memoryContext = recentMemories
            .map(m => `[Mémoire: ${m.content}]`)
            .join('\n');
          
          aiMessages.unshift({
            role: 'system',
            content: this.getSystemPrompt(memoryContext)
          });
        } else {
          aiMessages.unshift({
            role: 'system',
            content: this.getSystemPrompt()
          });
        }
      } else {
        aiMessages.unshift({
          role: 'system',
          content: this.getSystemPrompt()
        });
      }

      const llmService = ResilientLLMService.getInstance();
      const currentProvider = llmService.getCurrentProvider();

      // Use streaming if supported and enabled
      if (FeatureFlagService.getInstance().isEnabled(FeatureFlags.STREAMING_RESPONSES) && 
          currentProvider.supportsStreaming && onToken) {
        
        let fullResponse = '';
        
        await llmService.streamResponse(aiMessages, {
          maxTokens: 1024,
          temperature: 0.7
        }, {
          onToken: (token) => {
            fullResponse = token;
            onToken(token);
          },
          onComplete: (response) => {
            fullResponse = response.content;
            this.saveConversationMemory(messages, fullResponse);
            if (onComplete) {
              onComplete(fullResponse);
            }
          },
          onError: (error) => {
            console.error('Streaming failed:', error);
            this.handleGenerationError(error, onToken, onComplete);
          }
        });

        return fullResponse;
      } else {
        // Non-streaming response
        const response = await llmService.generateResponse(aiMessages, {
          maxTokens: 1024,
          temperature: 0.7
        });

        const fullResponse = response.content;

        // Simulate streaming for consistency
        if (onToken) {
          const words = fullResponse.split(' ');
          for (let i = 0; i < words.length; i++) {
            const partial = words.slice(0, i + 1).join(' ');
            onToken(partial);
            await new Promise(resolve => setTimeout(resolve, 30));
          }
        }

        await this.saveConversationMemory(messages, fullResponse);

        if (onComplete) {
          onComplete(fullResponse);
        }

        return fullResponse;
      }
    } catch (error) {
      console.error('Failed to generate response:', error);
      return this.handleGenerationError(error, onToken, onComplete);
    }
  }

  private getSystemPrompt(memoryContext?: string): string {
    const basePrompt = `Tu es monGARS, un assistant IA privé et sécurisé qui fonctionne entièrement sur l'appareil de l'utilisateur. Tu parles français canadien et tu es très utile, respectueux et empathique.

Caractéristiques importantes:
- Tu es 100% privé - aucune donnée ne quitte l'appareil
- Tu es sécurisé par authentification biométrique
- Tu respectes la vie privée absolument  
- Répond en français canadien de manière naturelle et conversationnelle`;

    if (memoryContext) {
      return `${basePrompt}
- Tu peux mémoriser les conversations importantes

Voici quelques mémoires récentes pour le contexte:
${memoryContext}`;
    }

    return basePrompt;
  }

  private async saveConversationMemory(messages: AssistantMessage[], response: string): Promise<void> {
    if (!FeatureFlagService.getInstance().isEnabled(FeatureFlags.CONTEXT_MEMORY)) {
      return;
    }

    try {
      await this.memoryService.saveMemory(
        `Q: ${messages[messages.length - 1]?.content || ''}\nR: ${response}`,
        { 
          type: 'conversation', 
          timestamp: Date.now(),
          provider: ResilientLLMService.getInstance().getCurrentProvider().name
        }
      );

      this.auditService.log('memory_write', 'Conversation saved to memory');
    } catch (error) {
      console.error('Failed to save conversation memory:', error);
    }
  }

  private handleGenerationError(
    error: unknown, 
    onToken?: (token: string) => void,
    onComplete?: (fullResponse: string) => void
  ): string {
    this.auditService.log('auth_failed', `Response generation failed: ${error}`);
    
    const errorMessage = 'Désolé, je ne peux pas traiter votre demande en ce moment. Veuillez réessayer.';
    
    if (onToken) {
      onToken(errorMessage);
    }
    
    if (onComplete) {
      onComplete(errorMessage);
    }

    return errorMessage;
  }

  async speakText(text: string): Promise<void> {
    try {
      await Speech.speak(text, {
        language: 'fr-CA',
        rate: 1.0,
        pitch: 1.0
      });
      
      this.auditService.log('tts_used', `Text-to-speech: ${text.substring(0, 50)}...`);
    } catch (error) {
      console.error('Failed to speak text:', error);
    }
  }

  stopSpeaking(): void {
    Speech.stop();
  }

  isSpeaking(): boolean {
    return Speech.isSpeakingAsync();
  }
}