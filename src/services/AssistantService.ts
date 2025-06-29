import { getAnthropicTextResponse } from '../api/chat-service';
import { AssistantMessage } from '../types/core';
import { AIMessage } from '../types/ai';
import { MemoryService } from './MemoryService';
import { AuditService } from './AuditService';
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

      // Add context from memory
      const recentMemories = await this.memoryService.getMemories(undefined, 5);
      if (recentMemories.length > 0) {
        const memoryContext = recentMemories
          .map(m => `[Mémoire: ${m.content}]`)
          .join('\n');
        
        aiMessages.unshift({
          role: 'system',
          content: `Tu es monGARS, un assistant IA privé et sécurisé qui fonctionne entièrement sur l'appareil de l'utilisateur. Tu parles français canadien et tu es très utile, respectueux et empathique. 

Caractéristiques importantes:
- Tu es 100% privé - aucune donnée ne quitte l'appareil
- Tu es sécurisé par authentification biométrique 
- Tu peux mémoriser les conversations importantes
- Tu respectes la vie privée absolument
- Répond en français canadien de manière naturelle et conversationnelle

Voici quelques mémoires récentes pour le contexte:\n${memoryContext}`
        });
      } else {
        aiMessages.unshift({
          role: 'system',
          content: `Tu es monGARS, un assistant IA privé et sécurisé qui fonctionne entièrement sur l'appareil de l'utilisateur. Tu parles français canadien et tu es très utile, respectueux et empathique.

Caractéristiques importantes:
- Tu es 100% privé - aucune donnée ne quitte l'appareil
- Tu es sécurisé par authentification biométrique
- Tu respectes la vie privée absolument  
- Répond en français canadien de manière naturelle et conversationnelle`
        });
      }

      // For streaming simulation, we'll get the full response and then emit tokens
      const response = await getAnthropicTextResponse(aiMessages, {
        maxTokens: 1024,
        temperature: 0.7
      });

      const fullResponse = response.content;

      // Simulate streaming by emitting tokens
      if (onToken) {
        const words = fullResponse.split(' ');
        for (let i = 0; i < words.length; i++) {
          const partial = words.slice(0, i + 1).join(' ');
          onToken(partial);
          
          // Small delay to simulate streaming
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      // Save the conversation to memory
      await this.memoryService.saveMemory(
        `Q: ${messages[messages.length - 1]?.content || ''}\nR: ${fullResponse}`,
        { type: 'conversation', timestamp: Date.now() }
      );

      this.auditService.log('memory_write', 'Conversation saved to memory');

      if (onComplete) {
        onComplete(fullResponse);
      }

      return fullResponse;
    } catch (error) {
      console.error('Failed to generate response:', error);
      const errorMessage = 'Désolé, je ne peux pas traiter votre demande en ce moment.';
      
      if (onToken) {
        onToken(errorMessage);
      }
      
      if (onComplete) {
        onComplete(errorMessage);
      }

      return errorMessage;
    }
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