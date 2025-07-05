import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface LocalLLMSpec extends TurboModule {
  // Model Management
  loadModel(modelName: string): Promise<boolean>;
  unloadModel(modelName: string): Promise<boolean>;
  getLoadedModels(): Promise<string[]>;
  getModelInfo(modelName: string): Promise<{
    name: string;
    size: number;
    version: string;
    capabilities: string[];
    loaded: boolean;
    downloaded: boolean;
  }>;
  
  // Model Download Management
  downloadModel(modelName: string, downloadURL: string): Promise<{
    downloadStarted?: boolean;
    success?: boolean;
    modelName: string;
    localPath?: string;
  }>;
  cancelDownload(modelName: string): Promise<boolean>;
  getDownloadProgress(modelName: string): Promise<{
    modelName: string;
    isDownloading: boolean;
    bytesReceived?: number;
    totalBytes?: number;
    progress: number;
  }>;
  deleteModel(modelName: string): Promise<boolean>;
  getAvailableSpace(): Promise<{
    freeSpace: number;
    totalSpace: number;
    usedSpace: number;
  }>;
  listDownloadedModels(): Promise<Array<{
    name: string;
    size: number;
    downloadDate: number;
    loaded: boolean;
  }>>;
  
  // State Management
  initializeState(): Promise<string>; // Returns state ID
  saveState(stateId: string): Promise<boolean>;
  loadState(stateId: string): Promise<boolean>;
  clearState(stateId: string): Promise<boolean>;
  
  // Generation
  generateText(prompt: string, options?: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    topK?: number;
    stateId?: string;
  }): Promise<{
    text: string;
    tokens: number;
    finishReason: string;
    processingTime: number;
  }>;
  
  // Streaming Generation
  generateStream(prompt: string, options?: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    topK?: number;
    stateId?: string;
  }): Promise<string>; // Returns stream session ID
  
  getStreamToken(sessionId: string): Promise<{
    token: string;
    finished: boolean;
    error?: string;
  }>;
  
  stopStream(sessionId: string): Promise<boolean>;
  
  // Context Management
  setSystemPrompt(prompt: string, stateId?: string): Promise<boolean>;
  getSystemPrompt(stateId?: string): Promise<string>;
  addToContext(message: string, role: 'user' | 'assistant', stateId?: string): Promise<boolean>;
  getContext(stateId?: string): Promise<Array<{
    role: string;
    content: string;
    timestamp: number;
  }>>;
  clearContext(stateId?: string): Promise<boolean>;
  
  // Performance Monitoring
  getPerformanceStats(): Promise<{
    totalInferences: number;
    averageLatency: number;
    memoryUsage: number;
    cpuUsage: number;
    gpuUsage: number;
  }>;
  
  // Model Configuration
  setModelConfig(config: {
    maxContextLength?: number;
    batchSize?: number;
    numThreads?: number;
    useGPU?: boolean;
  }): Promise<boolean>;
  
  getModelConfig(): Promise<{
    maxContextLength: number;
    batchSize: number;
    numThreads: number;
    useGPU: boolean;
  }>;
}

export default TurboModuleRegistry.getEnforcing<LocalLLMSpec>('LocalLLMModule');