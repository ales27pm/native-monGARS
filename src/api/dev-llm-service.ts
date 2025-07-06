// import { NativeModules, Platform } from 'react-native'; // Unused for dev service
import { getOpenAIChatResponse, getAnthropicChatResponse } from './chat-service';
import type { NativeModelMetadata, GenerationConfig, GenerationResult, DownloadProgressEvent, ModelEvent } from './native-llm-service';

// Development LLM Service that uses actual AI APIs instead of mocks
class DevLLMService {
  private listeners: Map<string, Function[]> = new Map();
  private currentModel: string | null = null;
  private downloadedModels: Set<string> = new Set();

  constructor() {
    // In development, we'll simulate having models available
    console.log('🔧 DevLLMService: Initializing development LLM service with real AI APIs');
  }

  // Event management
  on(event: string, listener: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    const eventListeners = this.listeners.get(event)!;
    eventListeners.push(listener);

    return () => {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    };
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event) || [];
    eventListeners.forEach(listener => listener(data));
  }

  async getAvailableModels(): Promise<NativeModelMetadata[]> {
    return [
      {
        id: 'llama-3.2-3b-instruct',
        name: 'Llama 3.2 3B Instruct (via OpenAI)',
        version: '1.0.0',
        contextLength: 8192,
        vocabularySize: 128256,
        isQuantized: true,
        precisionBits: 4,
        isDownloaded: this.downloadedModels.has('llama-3.2-3b-instruct'),
        isLoaded: this.currentModel === 'llama-3.2-3b-instruct'
      },
      {
        id: 'claude-3-haiku',
        name: 'Claude 3 Haiku (via Anthropic)',
        version: '1.0.0',
        contextLength: 200000,
        vocabularySize: 100000,
        isQuantized: false,
        precisionBits: 16,
        isDownloaded: this.downloadedModels.has('claude-3-haiku'),
        isLoaded: this.currentModel === 'claude-3-haiku'
      }
    ];
  }

  async downloadModel(modelId: string): Promise<void> {
    console.log(`🔄 DevLLMService: Starting download for ${modelId}`);
    
    // Emit download progress events
    this.emit('downloadProgress', {
      modelId,
      progress: 0,
      status: 'downloading'
    } as DownloadProgressEvent);

    // Simulate download progress
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      this.emit('downloadProgress', {
        modelId,
        progress,
        status: progress < 100 ? 'downloading' : 'installing'
      } as DownloadProgressEvent);
    }

    // Mark as downloaded
    this.downloadedModels.add(modelId);
    
    this.emit('downloadComplete', {
      modelId
    } as ModelEvent);

    console.log(`✅ DevLLMService: Download completed for ${modelId}`);
  }

  async loadModel(modelId: string): Promise<void> {
    if (!this.downloadedModels.has(modelId)) {
      throw new Error(`Model ${modelId} must be downloaded first`);
    }

    console.log(`🔄 DevLLMService: Loading model ${modelId}`);
    
    // Simulate loading time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.currentModel = modelId;
    
    this.emit('modelLoaded', {
      modelId
    } as ModelEvent);

    console.log(`✅ DevLLMService: Model ${modelId} loaded successfully`);
  }

  async deleteModel(modelId: string): Promise<void> {
    if (this.currentModel === modelId) {
      throw new Error(`Cannot delete active model ${modelId}`);
    }

    this.downloadedModels.delete(modelId);
    console.log(`🗑️ DevLLMService: Model ${modelId} deleted`);
  }

  async generateText(
    prompt: string,
    _config: GenerationConfig = {
      maxTokens: 256,
      temperature: 0.7,
      topP: 0.9
    }
  ): Promise<GenerationResult> {
    if (!this.currentModel) {
      throw new Error('No model is currently loaded');
    }

    console.log(`🤖 DevLLMService: Generating text with ${this.currentModel}`);
    const startTime = Date.now();

    let responseText: string;

    try {
      // Use actual AI APIs based on the selected model
      if (this.currentModel === 'claude-3-haiku') {
        const response = await getAnthropicChatResponse(prompt);
        responseText = response.content;
      } else {
        // Default to OpenAI for other models
        const response = await getOpenAIChatResponse(prompt);
        responseText = response.content;
      }

      const processingTime = (Date.now() - startTime) / 1000;
      const tokenCount = Math.ceil(responseText.length / 4); // Rough token estimate

      const result: GenerationResult = {
        text: responseText,
        tokenCount,
        processingTime
      };

      this.emit('inferenceComplete', {
        modelId: this.currentModel,
        text: responseText,
        tokenCount,
        processingTime
      } as ModelEvent);

      console.log(`✅ DevLLMService: Generated ${tokenCount} tokens in ${processingTime}s`);
      return result;

    } catch (error) {
      this.emit('inferenceError', {
        modelId: this.currentModel,
        error: error instanceof Error ? error.message : 'Unknown error'
      } as ModelEvent);
      throw error;
    }
  }

  async getCurrentModel(): Promise<NativeModelMetadata | null> {
    if (!this.currentModel) return null;
    
    const models = await this.getAvailableModels();
    return models.find(model => model.id === this.currentModel) || null;
  }

  async getModelStats(): Promise<{
    availableModels: number;
    downloadedModels: number;
    activeModel: string | null;
  }> {
    const models = await this.getAvailableModels();
    return {
      availableModels: models.length,
      downloadedModels: this.downloadedModels.size,
      activeModel: this.currentModel
    };
  }

  async generateTextStream(
    prompt: string,
    config: GenerationConfig,
    onToken: (token: string) => void
  ): Promise<void> {
    const result = await this.generateText(prompt, config);
    
    // Simulate streaming by splitting the result
    const words = result.text.split(' ');
    for (const word of words) {
      onToken(word + ' ');
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  destroy() {
    this.listeners.clear();
    console.log('🔧 DevLLMService: Service destroyed');
  }
}

// Create and export the development service instance
// This replaces the native iOS service in development environment
export const nativeLLMService = new DevLLMService();

export default nativeLLMService;