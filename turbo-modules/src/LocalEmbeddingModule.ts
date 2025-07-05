import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface LocalEmbeddingSpec extends TurboModule {
  // Model Management
  loadEmbeddingModel(modelName: string): Promise<boolean>;
  unloadEmbeddingModel(modelName: string): Promise<boolean>;
  getLoadedEmbeddingModels(): Promise<string[]>;
  getEmbeddingModelInfo(modelName: string): Promise<{
    name: string;
    dimensions: number;
    size: number;
    version: string;
    loaded: boolean;
  }>;
  
  // Embedding Generation
  generateEmbedding(text: string, modelName?: string): Promise<number[]>;
  generateEmbeddings(texts: string[], modelName?: string): Promise<number[][]>;
  
  // Batch Processing
  processBatch(texts: string[], batchSize?: number, modelName?: string): Promise<{
    embeddings: number[][];
    processingTime: number;
    tokensProcessed: number;
  }>;
  
  // Vector Operations
  cosineSimilarity(vector1: number[], vector2: number[]): Promise<number>;
  dotProduct(vector1: number[], vector2: number[]): Promise<number>;
  euclideanDistance(vector1: number[], vector2: number[]): Promise<number>;
  normalize(vector: number[]): Promise<number[]>;
  
  // Vector Search
  findSimilar(queryVector: number[], vectors: number[][], topK?: number): Promise<Array<{
    index: number;
    similarity: number;
  }>>;
  
  // Model Configuration
  getEmbeddingDimensions(modelName?: string): Promise<number>;
  getMaxTokens(modelName?: string): Promise<number>;
  setEmbeddingConfig(config: {
    batchSize?: number;
    numThreads?: number;
    useGPU?: boolean;
  }): Promise<boolean>;
  
  // Performance Monitoring
  getEmbeddingStats(): Promise<{
    totalEmbeddings: number;
    averageLatency: number;
    memoryUsage: number;
    cacheHitRate: number;
  }>;
  
  // Caching
  cacheEmbedding(text: string, embedding: number[], modelName?: string): Promise<boolean>;
  getCachedEmbedding(text: string, modelName?: string): Promise<number[] | null>;
  clearEmbeddingCache(modelName?: string): Promise<boolean>;
  getCacheStats(): Promise<{
    size: number;
    hitRate: number;
    totalRequests: number;
  }>;
  
  // Text Processing
  preprocessText(text: string): Promise<string>;
  tokenize(text: string, modelName?: string): Promise<string[]>;
  getTokenCount(text: string, modelName?: string): Promise<number>;
}

export default TurboModuleRegistry.getEnforcing<LocalEmbeddingSpec>('LocalEmbeddingModule');