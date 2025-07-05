import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface AIProcessorSpec extends TurboModule {
  // AI Processing Methods
  optimizePrompt(prompt: string): Promise<string>;
  processResponse(response: string, provider: string): Promise<{
    processedText: string;
    confidence: number;
    processingTime: number;
  }>;
  
  // Context Management
  setContext(context: string): Promise<boolean>;
  getContext(): Promise<string>;
  clearContext(): Promise<boolean>;
  
  // Performance Optimization
  preloadModel(modelName: string): Promise<boolean>;
  getModelStatus(modelName: string): Promise<{
    loaded: boolean;
    size: number;
    lastUsed: number;
  }>;
  
  // Privacy Features
  sanitizeInput(input: string): Promise<string>;
  checkForSensitiveData(text: string): Promise<{
    hasSensitiveData: boolean;
    sensitiveTypes: string[];
  }>;
  
  // Caching and Performance
  cacheResponse(key: string, response: string): Promise<boolean>;
  getCachedResponse(key: string): Promise<string | null>;
  clearCache(): Promise<boolean>;
  getCacheStats(): Promise<{
    size: number;
    hitRate: number;
    totalRequests: number;
  }>;
}

export default TurboModuleRegistry.getEnforcing<AIProcessorSpec>('AIProcessorModule');