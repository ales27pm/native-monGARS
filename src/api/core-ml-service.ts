import { Alert } from 'react-native';

export interface CoreMLModel {
  id: string;
  name: string;
  description: string;
  size: string;
  downloadUrl: string;
  isDownloaded: boolean;
  isActive: boolean;
  capabilities: string[];
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

  constructor() {
    this.initializeAvailableModels();
  }

  private initializeAvailableModels() {
    const availableModels: CoreMLModel[] = [
      {
        id: 'llama-2-7b-chat',
        name: 'Llama 2 7B Chat',
        description: 'Meta\'s Llama 2 model optimized for conversational AI',
        size: '3.5 GB',
        downloadUrl: 'https://huggingface.co/mlx-community/Llama-2-7b-chat-hf-mlx',
        isDownloaded: false,
        isActive: false,
        capabilities: ['chat', 'reasoning', 'code']
      },
      {
        id: 'phi-3-mini',
        name: 'Phi-3 Mini',
        description: 'Microsoft\'s compact language model for mobile devices',
        size: '2.1 GB',
        downloadUrl: 'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct',
        isDownloaded: true, // Pre-installed for demo
        isActive: true,
        capabilities: ['chat', 'reasoning', 'summarization']
      },
      {
        id: 'gemma-2b',
        name: 'Gemma 2B',
        description: 'Google\'s lightweight model for on-device inference',
        size: '1.4 GB',
        downloadUrl: 'https://huggingface.co/google/gemma-2b-it',
        isDownloaded: false,
        isActive: false,
        capabilities: ['chat', 'text-generation']
      },
      {
        id: 'mistral-7b-instruct',
        name: 'Mistral 7B Instruct',
        description: 'High-performance instruction-following model',
        size: '4.1 GB',
        downloadUrl: 'https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.2',
        isDownloaded: false,
        isActive: false,
        capabilities: ['chat', 'instruction-following', 'code']
      }
    ];

    availableModels.forEach(model => {
      this.models.set(model.id, model);
    });
  }

  getAvailableModels(): CoreMLModel[] {
    return Array.from(this.models.values());
  }

  getActiveModel(): CoreMLModel | null {
    const activeModel = Array.from(this.models.values()).find(model => model.isActive);
    return activeModel || null;
  }

  async downloadModel(modelId: string): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    if (model.isDownloaded) {
      throw new Error(`Model ${modelId} is already downloaded`);
    }

    // Simulate download progress
    return new Promise((resolve, reject) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15 + 5; // 5-20% increments
        
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          // Update model status
          model.isDownloaded = true;
          this.models.set(modelId, model);
          
          this.notifyDownloadProgress({
            modelId,
            progress: 100,
            status: 'completed'
          });
          
          resolve();
        } else {
          this.notifyDownloadProgress({
            modelId,
            progress: Math.min(progress, 95),
            status: progress < 80 ? 'downloading' : 'installing'
          });
        }
      }, 800);
    });
  }

  async activateModel(modelId: string): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    if (!model.isDownloaded) {
      throw new Error(`Model ${modelId} must be downloaded first`);
    }

    // Deactivate all other models
    this.models.forEach(m => {
      m.isActive = false;
    });

    // Activate the selected model
    model.isActive = true;
    this.models.set(modelId, model);
  }

  async deleteModel(modelId: string): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    if (model.isActive) {
      throw new Error(`Cannot delete active model ${modelId}`);
    }

    model.isDownloaded = false;
    this.models.set(modelId, model);
  }

  async generateResponse(prompt: string): Promise<string> {
    const activeModel = this.getActiveModel();
    if (!activeModel) {
      throw new Error('No active model available');
    }

    // Simulate AI response generation
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const responses = [
      "I understand your request. As an AI assistant running locally on your device, I can help you with various tasks while keeping your data completely private.",
      "That's an interesting question! Since I'm running entirely on your device using Core ML, I can provide responses without any data leaving your phone.",
      "I'm processing your request using the local language model. This ensures maximum privacy and fast responses without internet dependency.",
      "Based on my understanding, I can assist you with that. All processing happens locally on your device for complete privacy protection.",
      "Let me help you with that. I'm running the " + activeModel.name + " model locally, so your conversations remain completely private."
    ];

    return responses[Math.floor(Math.random() * responses.length)];
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

  getStorageInfo(): { totalUsed: string; available: string } {
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