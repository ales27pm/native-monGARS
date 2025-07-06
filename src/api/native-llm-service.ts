import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

// Type definitions
export interface NativeModelMetadata {
  id: string;
  name: string;
  version: string;
  contextLength: number;
  vocabularySize: number;
  isQuantized: boolean;
  precisionBits: number;
  isDownloaded: boolean;
  isLoaded: boolean;
}

export interface GenerationConfig {
  maxTokens: number;
  temperature: number;
  topP: number;
  stopSequences?: string[];
}

export interface GenerationResult {
  text: string;
  tokenCount: number;
  processingTime: number;
}

export interface DownloadProgressEvent {
  modelId: string;
  progress: number;
  status: 'downloading' | 'installing';
}

export interface ModelEvent {
  modelId: string;
  error?: string;
  text?: string;
  tokenCount?: number;
  processingTime?: number;
}

// Native module interface
interface LocalLLMModuleInterface {
  downloadModel(modelId: string): Promise<{ success: boolean; modelId: string }>;
  loadModel(modelId: string): Promise<{ success: boolean; modelId: string }>;
  deleteModel(modelId: string): Promise<{ success: boolean }>;
  getAvailableModels(): Promise<NativeModelMetadata[]>;
  generateText(
    prompt: string,
    maxTokens: number,
    temperature: number,
    topP: number
  ): Promise<GenerationResult>;
}

// Native module and event emitter
const LocalLLMModule = NativeModules.LocalLLMModule as LocalLLMModuleInterface;
const LocalLLMEventEmitter = Platform.OS === 'ios' && NativeModules.LocalLLMModule
  ? new NativeEventEmitter(NativeModules.LocalLLMModule)
  : null;

// Service class
class NativeLLMService {
  private listeners: Map<string, Function[]> = new Map();
  private eventEmitter: NativeEventEmitter | null = null;

  constructor() {
    this.eventEmitter = LocalLLMEventEmitter;
    if (this.eventEmitter) {
      this.setupEventListeners();
    }
  }

  private setupEventListeners() {
    if (!this.eventEmitter) return;

    // Download progress events
    this.eventEmitter.addListener('ModelDownloadProgress', (event: DownloadProgressEvent) => {
      this.emit('downloadProgress', event);
    });

    this.eventEmitter.addListener('ModelDownloadComplete', (event: ModelEvent) => {
      this.emit('downloadComplete', event);
    });

    this.eventEmitter.addListener('ModelDownloadError', (event: ModelEvent) => {
      this.emit('downloadError', event);
    });

    // Model loading events
    this.eventEmitter.addListener('ModelLoadComplete', (event: ModelEvent) => {
      this.emit('modelLoaded', event);
    });

    this.eventEmitter.addListener('ModelLoadError', (event: ModelEvent) => {
      this.emit('modelLoadError', event);
    });

    // Inference events
    this.eventEmitter.addListener('InferenceComplete', (event: ModelEvent) => {
      this.emit('inferenceComplete', event);
    });

    this.eventEmitter.addListener('InferenceError', (event: ModelEvent) => {
      this.emit('inferenceError', event);
    });
  }

  // Event management
  on(event: string, listener: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    const eventListeners = this.listeners.get(event)!;
    eventListeners.push(listener);

    // Return unsubscribe function
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

  // Model management
  async getAvailableModels(): Promise<NativeModelMetadata[]> {
    if (!LocalLLMModule) {
      throw new Error('LocalLLMModule not available on this platform');
    }
    
    return await LocalLLMModule.getAvailableModels();
  }

  async downloadModel(modelId: string): Promise<void> {
    if (!LocalLLMModule) {
      throw new Error('LocalLLMModule not available on this platform');
    }

    const result = await LocalLLMModule.downloadModel(modelId);
    if (!result.success) {
      throw new Error(`Failed to download model ${modelId}`);
    }
  }

  async loadModel(modelId: string): Promise<void> {
    if (!LocalLLMModule) {
      throw new Error('LocalLLMModule not available on this platform');
    }

    const result = await LocalLLMModule.loadModel(modelId);
    if (!result.success) {
      throw new Error(`Failed to load model ${modelId}`);
    }
  }

  async deleteModel(modelId: string): Promise<void> {
    if (!LocalLLMModule) {
      throw new Error('LocalLLMModule not available on this platform');
    }

    const result = await LocalLLMModule.deleteModel(modelId);
    if (!result.success) {
      throw new Error(`Failed to delete model ${modelId}`);
    }
  }

  async generateText(
    prompt: string,
    config: GenerationConfig = {
      maxTokens: 256,
      temperature: 0.7,
      topP: 0.9
    }
  ): Promise<GenerationResult> {
    if (!LocalLLMModule) {
      throw new Error('LocalLLMModule not available on this platform');
    }

    // Format prompt for Llama 3.2 Instruct format
    const formattedPrompt = this.formatPromptForLlama32(prompt);

    return await LocalLLMModule.generateText(
      formattedPrompt,
      config.maxTokens,
      config.temperature,
      config.topP
    );
  }

  private formatPromptForLlama32(prompt: string): string {
    // Llama 3.2 Instruct format
    return `<|begin_of_text|><|start_header_id|>system<|end_header_id|>

You are a helpful AI assistant running locally on the user's device. Provide accurate, helpful responses while being concise and clear.<|eot_id|><|start_header_id|>user<|end_header_id|>

${prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

`;
  }

  // Utility methods
  async getCurrentModel(): Promise<NativeModelMetadata | null> {
    const models = await this.getAvailableModels();
    return models.find(model => model.isLoaded) || null;
  }

  async getModelStats(): Promise<{
    availableModels: number;
    downloadedModels: number;
    activeModel: string | null;
  }> {
    const models = await this.getAvailableModels();
    const downloadedModels = models.filter(m => m.isDownloaded);
    const activeModel = models.find(m => m.isLoaded);

    return {
      availableModels: models.length,
      downloadedModels: downloadedModels.length,
      activeModel: activeModel?.name || null
    };
  }

  // Streaming generation (for future implementation)
  async generateTextStream(
    prompt: string,
    config: GenerationConfig,
    onToken: (token: string) => void
  ): Promise<void> {
    // For now, fall back to regular generation
    // In future, this could be implemented with native streaming
    const result = await this.generateText(prompt, config);
    
    // Simulate streaming by splitting the result
    const words = result.text.split(' ');
    for (const word of words) {
      onToken(word + ' ');
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  // Cleanup
  destroy() {
    this.listeners.clear();
    if (this.eventEmitter) {
      this.eventEmitter.removeAllListeners('ModelDownloadProgress');
      this.eventEmitter.removeAllListeners('ModelDownloadComplete');
      this.eventEmitter.removeAllListeners('ModelDownloadError');
      this.eventEmitter.removeAllListeners('ModelLoadComplete');
      this.eventEmitter.removeAllListeners('ModelLoadError');
      this.eventEmitter.removeAllListeners('InferenceComplete');
      this.eventEmitter.removeAllListeners('InferenceError');
    }
  }
}

// Export singleton instance
export const nativeLLMService = new NativeLLMService();
export default nativeLLMService;