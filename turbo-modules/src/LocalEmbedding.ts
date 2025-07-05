import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface LocalEmbeddingSpec extends TurboModule {
  generateEmbedding(text: string): Promise<number[]>;
  generateBatchEmbeddings(texts: string[]): Promise<number[][]>;
  loadEmbeddingModel(modelName: string): Promise<boolean>;
  getEmbeddingDimensions(): Promise<number>;
  getMaxTokenLength(): Promise<number>;
}

export default TurboModuleRegistry.getEnforcing<LocalEmbeddingSpec>('LocalEmbeddingModule');