import { Alert } from 'react-native';
import { nativeLLMService } from './dev-llm-service';
import type { NativeModelMetadata, GenerationResult } from './native-llm-service';

export interface CoreMLModel {
  id: string;
  name: string;
  description: string;
  size: string;
  downloadUrl: string;
  isDownloaded: boolean;
  isActive: boolean;
  capabilities: string[];
  version?: string;
  contextLength?: number;
  isQuantized?: boolean;
  precisionBits?: number;
}

export interface DownloadProgress {
  modelId: string;
  progress: number; // 0-100
  status: 'downloading' | 'installing' | 'completed' | 'error';
  error?: string;
}

class CoreMLService {
  private models: Map<string, CoreMLModel> = new Map();
  private downloadListeners: Set<(progress: DownloadProgress) => void> = new Set();
  private isInitialized = false;

  constructor() {
    // Don't initialize immediately to prevent runtime errors
    // Initialize on first use instead
  }

  private async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initializeService();
    }
  }

  private async initializeService() {
    if (this.isInitialized) return;
    
    // Get native models and merge with static model data
    const nativeModels = await nativeLLMService.getAvailableModels();
    this.initializeModelsFromNative(nativeModels);
    
    // Setup native event listeners
    this.setupNativeEventListeners();
    
    this.isInitialized = true;
    console.log('✅ CoreMLService: Initialized successfully');
  }

  private initializeModelsFromNative(nativeModels: NativeModelMetadata[]) {
    // Enhanced model information with UI-friendly data
    const modelEnhancements: Record<string, Partial<CoreMLModel>> = {
      'llama-3.2-3b-instruct': {
        name: 'Llama 3.2 3B Instruct',
        description: 'Meta\'s latest Llama 3.2 model optimized for mobile devices with excellent instruction following',
        size: '1.8 GB',
        downloadUrl: 'https://huggingface.co/andmev/Llama-3.2-3B-Instruct-CoreML',
        capabilities: ['chat', 'reasoning', 'instruction-following', 'code', 'summarization']
      }
    };

    nativeModels.forEach(nativeModel => {
      const enhancement = modelEnhancements[nativeModel.id] || {};
      
      const model: CoreMLModel = {
        id: nativeModel.id,
        name: enhancement.name || nativeModel.name,
        description: enhancement.description || `${nativeModel.name} - Advanced language model`,
        size: enhancement.size || this.calculateModelSize(nativeModel),
        downloadUrl: enhancement.downloadUrl || '',
        isDownloaded: nativeModel.isDownloaded,
        isActive: nativeModel.isLoaded,
        capabilities: enhancement.capabilities || ['chat', 'text-generation'],
        version: nativeModel.version,
        contextLength: nativeModel.contextLength,
        isQuantized: nativeModel.isQuantized,
        precisionBits: nativeModel.precisionBits
      };

      this.models.set(model.id, model);
    });
  }



  private calculateModelSize(nativeModel: NativeModelMetadata): string {
    // Estimate size based on model parameters and quantization
    const baseSize = nativeModel.vocabularySize * 0.001; // Rough estimate
    const quantizedSize = nativeModel.isQuantized ? baseSize * 0.25 : baseSize;
    return `${quantizedSize.toFixed(1)} GB`;
  }

  private setupNativeEventListeners() {
    // Download progress
    nativeLLMService.on('downloadProgress', (event: any) => {
      this.notifyDownloadProgress({
        modelId: event.modelId,
        progress: Math.round(event.progress * 100),
        status: event.status
      });
    });

    // Download complete
    nativeLLMService.on('downloadComplete', async (event: any) => {
      this.notifyDownloadProgress({
        modelId: event.modelId,
        progress: 100,
        status: 'completed'
      });
      
      // Refresh models
      await this.refreshModels();
    });

    // Download error
    nativeLLMService.on('downloadError', (event: any) => {
      this.notifyDownloadProgress({
        modelId: event.modelId,
        progress: 0,
        status: 'error',
        error: event.error
      });
    });

    // Model loaded
    nativeLLMService.on('modelLoaded', async (event: any) => {
      await this.refreshModels();
    });
  }

  private async refreshModels() {
    try {
      const nativeModels = await nativeLLMService.getAvailableModels();
      this.initializeModelsFromNative(nativeModels);
    } catch (error) {
      console.warn('Failed to refresh models:', error);
    }
  }

  async getAvailableModels(): Promise<CoreMLModel[]> {
    await this.ensureInitialized();
    return Array.from(this.models.values());
  }

  async getActiveModel(): Promise<CoreMLModel | null> {
    await this.ensureInitialized();
    const activeModel = Array.from(this.models.values()).find(model => model.isActive);
    return activeModel || null;
  }

  async downloadModel(modelId: string): Promise<void> {
    await this.ensureInitialized();
    
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    if (model.isDownloaded) {
      throw new Error(`Model ${modelId} is already downloaded`);
    }

    // Download using the appropriate service (native or development)
    await nativeLLMService.downloadModel(modelId);
  }



  async activateModel(modelId: string): Promise<void> {
    await this.ensureInitialized();
    
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    if (!model.isDownloaded) {
      throw new Error(`Model ${modelId} must be downloaded first`);
    }

    // Use the appropriate service (native or development)
    await nativeLLMService.loadModel(modelId);
    
    // Update local state
    this.models.forEach(m => {
      m.isActive = false;
    });
    
    model.isActive = true;
    this.models.set(modelId, model);
  }

  async deleteModel(modelId: string): Promise<void> {
    await this.ensureInitialized();
    
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    if (model.isActive) {
      throw new Error(`Cannot delete active model ${modelId}`);
    }

    // Use the appropriate service (native or development)
    await nativeLLMService.deleteModel(modelId);
    
    // Update local state
    model.isDownloaded = false;
    model.isActive = false;
    this.models.set(modelId, model);
  }

  async generateResponse(prompt: string): Promise<string> {
    await this.ensureInitialized();
    
    const activeModel = await this.getActiveModel();
    if (!activeModel) {
      throw new Error('No active model available');
    }

    // Use the appropriate service (native or development)
    const result = await nativeLLMService.generateText(prompt, {
      maxTokens: 256,
      temperature: 0.7,
      topP: 0.9
    });
    
    return result.text;
  }

  onDownloadProgress(listener: (progress: DownloadProgress) => void): () => void {
    this.downloadListeners.add(listener);
    return () => {
      this.downloadListeners.delete(listener);
    };
  }

  private notifyDownloadProgress(progress: DownloadProgress) {
    this.downloadListeners.forEach(listener => listener(progress));
  }

  async getStorageInfo(): Promise<{ totalUsed: string; available: string }> {
    await this.ensureInitialized();
    
    const downloadedModels = Array.from(this.models.values()).filter(m => m.isDownloaded);
    const totalSizeGB = downloadedModels.reduce((total, model) => {
      const sizeNum = parseFloat(model.size.replace(' GB', ''));
      return total + sizeNum;
    }, 0);

    return {
      totalUsed: `${totalSizeGB.toFixed(1)} GB`,
      available: `${(64 - totalSizeGB).toFixed(1)} GB` // Assuming 64GB device
    };
  }
}

export const coreMLService = new CoreMLService();