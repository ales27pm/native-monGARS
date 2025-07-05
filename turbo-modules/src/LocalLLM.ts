import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface ModelInfo {
  name: string;
  size: number;
  version: string;
  capabilities: string[];
  loaded: boolean;
}

export interface GenerationResult {
  token: string;
  finished: boolean;
  error?: string;
}

export interface GenerationOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  stateId?: string;
}

export interface LocalLLMSpec extends TurboModule {
  // Model management
  loadModel(modelName: string): Promise<boolean>;
  unloadModel(): Promise<void>;
  isModelLoaded(): Promise<boolean>;
  getModelInfo(): Promise<ModelInfo>;
  
  // Stateful inference
  initializeState(): Promise<string>;
  generateToken(stateId: string, inputTokens: number[]): Promise<GenerationResult>;
  resetState(stateId: string): Promise<void>;
  destroyState(stateId: string): Promise<void>;
  
  // Streaming generation
  generateStream(prompt: string, options?: GenerationOptions): Promise<string>;
  cancelGeneration(sessionId: string): Promise<void>;
  
  // Configuration
  setComputeUnits(units: 'cpu' | 'gpu' | 'ane' | 'all'): Promise<void>;
  setMaxSequenceLength(length: number): Promise<void>;
}

export default TurboModuleRegistry.getEnforcing<LocalLLMSpec>('LocalLLMModule');