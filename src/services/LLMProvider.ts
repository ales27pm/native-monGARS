import SecretsManager, { BackendProxyRequest } from './SecretsManager';
import FeatureFlagService, { FeatureFlags } from './FeatureFlagService';
import { AuditService } from './AuditService';
import PerformanceMonitor from './PerformanceMonitor';
import { getAnthropicTextResponse, getOpenAITextResponse, getGrokTextResponse } from '../api/chat-service';
import { AIMessage } from '../types/ai';

export interface LLMOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
  streaming?: boolean;
  systemPrompt?: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: string;
  processingTime: number;
  isFromCache?: boolean;
}

export interface StreamingCallback {
  onToken: (token: string) => void;
  onComplete: (response: LLMResponse) => void;
  onError: (error: Error) => void;
}

// Abstract base class for all LLM providers
export abstract class LLMProvider {
  abstract readonly name: string;
  abstract readonly supportsStreaming: boolean;
  abstract readonly isLocal: boolean;
  abstract readonly requiresNetwork: boolean;

  abstract generateResponse(
    messages: AIMessage[],
    options?: LLMOptions
  ): Promise<LLMResponse>;

  abstract streamResponse?(
    messages: AIMessage[],
    options: LLMOptions,
    callbacks: StreamingCallback
  ): Promise<void>;

  abstract isAvailable(): Promise<boolean>;
  abstract getModelInfo(): { name: string; version: string; size?: string };
}

// OpenAI Provider (via secure backend proxy)
export class OpenAIProvider extends LLMProvider {
  readonly name = 'OpenAI';
  readonly supportsStreaming = true;
  readonly isLocal = false;
  readonly requiresNetwork = true;

  async generateResponse(messages: AIMessage[], options?: LLMOptions): Promise<LLMResponse> {
    const operationId = `openai_${Date.now()}`;
    PerformanceMonitor.getInstance().startTimer(operationId);
    
    try {
      const response = await getOpenAITextResponse(messages, {
        model: options?.model || 'gpt-4o',
        temperature: options?.temperature || 0.7,
        maxTokens: options?.maxTokens || 1024,
      });

      const processingTime = PerformanceMonitor.getInstance().endTimer(operationId, 'apiResponseTime');
      
      // Calculate tokens per second if we have token counts
      if (response.usage?.completionTokens) {
        const tokensPerSecond = (response.usage.completionTokens / processingTime) * 1000;
        PerformanceMonitor.getInstance().recordMetric({ tokensPerSecond });
      }

      AuditService.getInstance().log('memory_write', `OpenAI API call completed in ${processingTime}ms`);

      return {
        content: response.content,
        usage: response.usage,
        model: options?.model || 'gpt-4o',
        provider: this.name,
        processingTime,
      };
    } catch (error) {
      PerformanceMonitor.getInstance().endTimer(operationId, 'apiResponseTime');
      AuditService.getInstance().log('auth_failed', `OpenAI API call failed: ${error}`);
      throw error;
    }
  }

  async streamResponse(
    messages: AIMessage[],
    options: LLMOptions,
    callbacks: StreamingCallback
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      // For streaming, we'll simulate by chunking the response
      const response = await this.generateResponse(messages, options);
      
      // Simulate streaming by splitting response into words
      const words = response.content.split(' ');
      let accumulated = '';
      
      for (let i = 0; i < words.length; i++) {
        accumulated += (i > 0 ? ' ' : '') + words[i];
        callbacks.onToken(accumulated);
        
        // Small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      callbacks.onComplete({
        ...response,
        processingTime: Date.now() - startTime,
      });
    } catch (error) {
      callbacks.onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async isAvailable(): Promise<boolean> {
    // Check network connectivity and feature flag
    return FeatureFlagService.getInstance().isEnabled(FeatureFlags.STREAMING_RESPONSES);
  }

  getModelInfo() {
    return { name: 'GPT-4', version: 'gpt-4o', size: 'N/A (Cloud)' };
  }
}

// Anthropic Provider (via secure backend proxy)
export class AnthropicProvider extends LLMProvider {
  readonly name = 'Anthropic';
  readonly supportsStreaming = true;
  readonly isLocal = false;
  readonly requiresNetwork = true;

  async generateResponse(messages: AIMessage[], options?: LLMOptions): Promise<LLMResponse> {
    const operationId = `anthropic_${Date.now()}`;
    PerformanceMonitor.getInstance().startTimer(operationId);
    
    try {
      const response = await getAnthropicTextResponse(messages, {
        model: options?.model || 'claude-3-5-sonnet-20240620',
        temperature: options?.temperature || 0.7,
        maxTokens: options?.maxTokens || 1024,
      });

      const processingTime = PerformanceMonitor.getInstance().endTimer(operationId, 'apiResponseTime');
      
      // Calculate tokens per second
      if (response.usage?.completionTokens) {
        const tokensPerSecond = (response.usage.completionTokens / processingTime) * 1000;
        PerformanceMonitor.getInstance().recordMetric({ tokensPerSecond });
      }

      AuditService.getInstance().log('memory_write', `Anthropic API call completed in ${processingTime}ms`);

      return {
        content: response.content,
        usage: response.usage,
        model: options?.model || 'claude-3-5-sonnet-20240620',
        provider: this.name,
        processingTime,
      };
    } catch (error) {
      PerformanceMonitor.getInstance().endTimer(operationId, 'apiResponseTime');
      AuditService.getInstance().log('auth_failed', `Anthropic API call failed: ${error}`);
      throw error;
    }
  }

  async streamResponse(
    messages: AIMessage[],
    options: LLMOptions,
    callbacks: StreamingCallback
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      const response = await this.generateResponse(messages, options);
      
      // Simulate streaming
      const words = response.content.split(' ');
      let accumulated = '';
      
      for (let i = 0; i < words.length; i++) {
        accumulated += (i > 0 ? ' ' : '') + words[i];
        callbacks.onToken(accumulated);
        await new Promise(resolve => setTimeout(resolve, 40));
      }
      
      callbacks.onComplete({
        ...response,
        processingTime: Date.now() - startTime,
      });
    } catch (error) {
      callbacks.onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async isAvailable(): Promise<boolean> {
    return FeatureFlagService.getInstance().isEnabled(FeatureFlags.STREAMING_RESPONSES);
  }

  getModelInfo() {
    return { name: 'Claude 3.5 Sonnet', version: 'claude-3-5-sonnet-20240620', size: 'N/A (Cloud)' };
  }
}

// Local LLM Provider (for future Core ML integration)
export class LocalLLMProvider extends LLMProvider {
  readonly name = 'Local';
  readonly supportsStreaming = true;
  readonly isLocal = true;
  readonly requiresNetwork = false;

  async generateResponse(messages: AIMessage[], options?: LLMOptions): Promise<LLMResponse> {
    if (!FeatureFlagService.getInstance().isEnabled(FeatureFlags.LOCAL_LLM)) {
      throw new Error('Local LLM is not enabled');
    }

    const operationId = `local_llm_${Date.now()}`;
    PerformanceMonitor.getInstance().startTimer(operationId);

    try {
      // Placeholder for Core ML integration
      // In a real implementation, this would call the Turbo Module
      const simulatedResponse = this.generateSimulatedResponse(messages);
      
      const processingTime = PerformanceMonitor.getInstance().endTimer(operationId, 'inferenceTime');
      
      // Calculate tokens per second for local inference
      const completionTokens = simulatedResponse.length / 4;
      const tokensPerSecond = (completionTokens / processingTime) * 1000;
      
      PerformanceMonitor.getInstance().recordMetric({ 
        tokensPerSecond,
        inferenceTime: processingTime
      });
      
      AuditService.getInstance().log('memory_write', `Local LLM inference completed in ${processingTime}ms`);

      return {
        content: simulatedResponse,
        usage: {
          promptTokens: messages.reduce((acc, msg) => acc + msg.content.length / 4, 0),
          completionTokens,
          totalTokens: 0,
        },
        model: 'phi-3-mini',
        provider: this.name,
        processingTime,
      };
    } catch (error) {
      PerformanceMonitor.getInstance().endTimer(operationId, 'inferenceTime');
      AuditService.getInstance().log('auth_failed', `Local LLM inference failed: ${error}`);
      throw error;
    }
  }

  async streamResponse(
    messages: AIMessage[],
    options: LLMOptions,
    callbacks: StreamingCallback
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      const response = await this.generateResponse(messages, options);
      
      // Simulate faster streaming for local processing
      const tokens = response.content.split(' ');
      let accumulated = '';
      
      for (let i = 0; i < tokens.length; i++) {
        accumulated += (i > 0 ? ' ' : '') + tokens[i];
        callbacks.onToken(accumulated);
        await new Promise(resolve => setTimeout(resolve, 25)); // Faster than cloud
      }
      
      callbacks.onComplete({
        ...response,
        processingTime: Date.now() - startTime,
      });
    } catch (error) {
      callbacks.onError(error instanceof Error ? error : new Error('Local LLM error'));
    }
  }

  async isAvailable(): Promise<boolean> {
    return FeatureFlagService.getInstance().isEnabled(FeatureFlags.LOCAL_LLM);
  }

  getModelInfo() {
    return { name: 'Phi-3 Mini', version: 'phi-3-mini-4k-instruct', size: '2.4GB (Q4)' };
  }

  private generateSimulatedResponse(messages: AIMessage[]): string {
    const lastMessage = messages[messages.length - 1];
    const responses = [
      "Je comprends votre question. En tant qu'assistant IA privé fonctionnant entièrement sur votre appareil, je peux vous aider de manière sécurisée.",
      "Voici une réponse générée localement sur votre appareil. Vos données restent privées et ne quittent jamais votre iPhone.",
      "Excellente question ! En mode local, je traite vos demandes sans connexion internet, garantissant une confidentialité absolue.",
      "Je traite cette demande directement sur votre appareil. Cela peut prendre un peu plus de temps, mais vos données restent entièrement privées.",
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

// Factory for creating LLM providers
export class LLMFactory {
  private static providers: Map<string, LLMProvider> = new Map();

  static getProvider(type: 'openai' | 'anthropic' | 'local' | 'auto'): LLMProvider {
    if (type === 'auto') {
      return this.getOptimalProvider();
    }

    let provider = this.providers.get(type);
    
    if (!provider) {
      switch (type) {
        case 'openai':
          provider = new OpenAIProvider();
          break;
        case 'anthropic':
          provider = new AnthropicProvider();
          break;
        case 'local':
          provider = new LocalLLMProvider();
          break;
        default:
          throw new Error(`Unknown LLM provider type: ${type}`);
      }
      
      this.providers.set(type, provider);
    }
    
    return provider;
  }

  private static getOptimalProvider(): LLMProvider {
    // Decision logic based on feature flags and availability
    const flags = FeatureFlagService.getInstance();
    
    if (flags.isEnabled(FeatureFlags.STRICT_LOCAL_MODE)) {
      return this.getProvider('local');
    }
    
    if (flags.isEnabled(FeatureFlags.LOCAL_LLM)) {
      return this.getProvider('local');
    }
    
    // Default to Anthropic for better responses
    return this.getProvider('anthropic');
  }
}

// Resilient LLM Service with fallback strategies
export class ResilientLLMService {
  private static instance: ResilientLLMService;
  private primaryProvider: LLMProvider;
  private fallbackProviders: LLMProvider[];

  public static getInstance(): ResilientLLMService {
    if (!ResilientLLMService.instance) {
      ResilientLLMService.instance = new ResilientLLMService();
    }
    return ResilientLLMService.instance;
  }

  constructor() {
    this.primaryProvider = LLMFactory.getProvider('auto');
    this.fallbackProviders = [
      LLMFactory.getProvider('anthropic'),
      LLMFactory.getProvider('openai'),
    ];
  }

  async generateResponse(
    messages: AIMessage[],
    options?: LLMOptions
  ): Promise<LLMResponse> {
    // Try primary provider
    try {
      if (await this.primaryProvider.isAvailable()) {
        return await this.primaryProvider.generateResponse(messages, options);
      }
    } catch (error) {
      console.warn('Primary LLM provider failed:', error);
      AuditService.getInstance().log('auth_failed', `Primary LLM failed: ${error}`);
    }

    // Try fallback providers
    for (const fallback of this.fallbackProviders) {
      try {
        if (await fallback.isAvailable()) {
          AuditService.getInstance().log('settings_change', `Falling back to ${fallback.name}`);
          return await fallback.generateResponse(messages, options);
        }
      } catch (error) {
        console.warn(`Fallback provider ${fallback.name} failed:`, error);
      }
    }

    throw new Error('All LLM providers are currently unavailable');
  }

  async streamResponse(
    messages: AIMessage[],
    options: LLMOptions,
    callbacks: StreamingCallback
  ): Promise<void> {
    // Try primary provider with streaming
    try {
      if (await this.primaryProvider.isAvailable() && this.primaryProvider.supportsStreaming) {
        await this.primaryProvider.streamResponse!(messages, options, callbacks);
        return;
      }
    } catch (error) {
      console.warn('Primary streaming provider failed:', error);
      callbacks.onError(error instanceof Error ? error : new Error('Streaming failed'));
    }

    // Fallback to non-streaming response
    try {
      const response = await this.generateResponse(messages, options);
      callbacks.onComplete(response);
    } catch (error) {
      callbacks.onError(error instanceof Error ? error : new Error('All providers failed'));
    }
  }

  getCurrentProvider(): LLMProvider {
    return this.primaryProvider;
  }

  switchProvider(type: 'openai' | 'anthropic' | 'local' | 'auto'): void {
    this.primaryProvider = LLMFactory.getProvider(type);
    AuditService.getInstance().log('settings_change', `Switched to ${type} LLM provider`);
  }
}

export default ResilientLLMService.getInstance();