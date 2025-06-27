// Cache service for native-monGARS LLM caching system
import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { compress, decompress, compressString, decompressString } from './CompressionUtils';
import { encodeTokens, decodeTokens, computeTolerance, computeSemanticScore } from './Tokenizer';
import SensorService from './SensorService';

const { LLMCacheModule } = NativeModules;
const CHUNK_SIZE = 32; // Tokens per chunk
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB default cache size
const PREFETCH_COUNT = 2; // Number of chunks to prefetch

export interface CacheStats {
  chunkCount: number;
  totalSize: number;
}

export interface CacheChunk {
  id: string;
  data: Uint8Array;
  metadata: {
    chunkIndex: number;
    lastUsed: number;
    toleranceScore: number;
    compressedSize: number;
  };
}

export default class CacheService {
  /**
   * Load conversation context from cache
   */
  static async loadContext(conversationId: string): Promise<string> {
    try {
      if (!LLMCacheModule) {
        console.warn('LLMCacheModule not available, using fallback storage');
        return await this.loadContextFallback(conversationId);
      }

      const stored: any[] = await LLMCacheModule.loadChunks(conversationId);
      if (!stored.length) return '';

      // Sort chunks by index to maintain order
      stored.sort((a, b) => a.metadata.chunkIndex - b.metadata.chunkIndex);

      // Decompress and reconstruct context
      const contextParts = stored.map(chunk => {
        try {
          const raw = decompress(chunk.data);
          return new TextDecoder().decode(raw);
        } catch (error) {
          console.warn('Failed to decompress chunk:', chunk.id, error);
          return '';
        }
      });

      return contextParts.join('');
    } catch (error) {
      console.error('Error loading context:', error);
      return await this.loadContextFallback(conversationId);
    }
  }

  /**
   * Save assistant response to cache with chunking
   */
  static async saveAssistantResponse(
    conversationId: string,
    responseText: string
  ): Promise<number> {
    try {
      if (!LLMCacheModule) {
        return await this.saveResponseFallback(conversationId, responseText);
      }

      const tokens = encodeTokens(responseText);
      let lastIndex = 0;

      // Split response into chunks and save each
      for (let i = 0; i < tokens.length; i += CHUNK_SIZE) {
        const slice = tokens.slice(i, i + CHUNK_SIZE);
        const text = decodeTokens(slice);
        const data = compress(new TextEncoder().encode(text));
        const chunkIndex = Math.floor(i / CHUNK_SIZE);

        const metadata = {
          conversationId,
          chunkIndex,
          lastUsed: Date.now(),
          toleranceScore: computeTolerance(slice),
          compressedSize: data.byteLength,
        };

        const chunkId = `${conversationId}_chunk_${chunkIndex}`;
        await LLMCacheModule.saveChunk(chunkId, data, metadata);
        lastIndex = chunkIndex;
      }

      // Schedule background cache management
      this.scheduleCacheOptimization();

      return lastIndex;
    } catch (error) {
      console.error('Error saving response:', error);
      return await this.saveResponseFallback(conversationId, responseText);
    }
  }

  /**
   * Clear entire cache
   */
  static async clearCache(): Promise<void> {
    try {
      if (LLMCacheModule) {
        await LLMCacheModule.clearAllChunks();
      }
      
      // Also clear fallback storage
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('mongars_cache_'));
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
      
      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  static async getStats(): Promise<CacheStats> {
    try {
      if (LLMCacheModule) {
        return await LLMCacheModule.getCacheStats();
      }
      
      return await this.getStatsFallback();
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { chunkCount: 0, totalSize: 0 };
    }
  }

  /**
   * Ensure cache stays within size limits
   */
  static async ensureCacheSize(): Promise<void> {
    try {
      const maxSizeStr = await AsyncStorage.getItem('cacheMaxSize');
      const maxSize = maxSizeStr ? parseInt(maxSizeStr, 10) : DEFAULT_MAX_SIZE;
      
      let stats = await this.getStats();
      let attempts = 0;
      const maxAttempts = 5; // Prevent infinite loops
      
      while (stats.totalSize > maxSize && attempts < maxAttempts) {
        if (LLMCacheModule) {
          await LLMCacheModule.evictChunks();
        } else {
          await this.evictChunksFallback();
        }
        
        stats = await this.getStats();
        attempts++;
      }
      
      if (attempts > 0) {
        console.log(`Cache optimized: evicted chunks in ${attempts} iterations`);
      }
    } catch (error) {
      console.error('Error managing cache size:', error);
    }
  }

  /**
   * Intelligent prefetching based on usage patterns
   */
  static async prefetchNext(
    conversationId: string,
    lastSavedIndex: number
  ): Promise<void> {
    try {
      // Check if prefetching is enabled
      const prefetchEnabled = await AsyncStorage.getItem('prefetchEnabled');
      if (prefetchEnabled !== 'true') return;

      // Check optimal conditions for prefetching
      const isOptimal = await SensorService.isOptimalForPrefetch();
      if (!isOptimal) {
        console.log('Skipping prefetch - conditions not optimal');
        return;
      }

      if (!LLMCacheModule) return;

      const stored: any[] = await LLMCacheModule.loadChunks(conversationId);
      
      // Find chunks to prefetch (next few chunks after last saved)
      const toPrefetch = stored
        .filter(chunk => {
          const idx = chunk.metadata.chunkIndex as number;
          return idx > lastSavedIndex && idx <= lastSavedIndex + PREFETCH_COUNT;
        })
        .sort((a, b) => a.metadata.chunkIndex - b.metadata.chunkIndex);

      // Prefetch by decompressing chunks (loads them into memory)
      for (const chunk of toPrefetch) {
        try {
          decompress(chunk.data);
          console.log(`Prefetched chunk ${chunk.id}`);
        } catch (error) {
          console.warn('Prefetch failed for chunk:', chunk.id, error);
        }
      }
    } catch (error) {
      console.warn('Prefetch error:', error);
    }
  }

  /**
   * Schedule prefetching operation
   */
  static schedulePrefetch(conversationId: string, lastIndex: number): void {
    // Run prefetch asynchronously without blocking
    setTimeout(() => {
      this.prefetchNext(conversationId, lastIndex).catch(console.warn);
    }, 100);
  }

  /**
   * Schedule cache optimization
   */
  private static scheduleCacheOptimization(): void {
    setTimeout(() => {
      this.ensureCacheSize().catch(console.warn);
    }, 1000);
  }

  // Fallback methods for when native module is not available

  private static async loadContextFallback(conversationId: string): Promise<string> {
    try {
      const stored = await AsyncStorage.getItem(`mongars_cache_${conversationId}`);
      if (!stored) return '';
      
      const data = JSON.parse(stored);
      return decompressString(data.content);
    } catch (error) {
      console.error('Fallback load error:', error);
      return '';
    }
  }

  private static async saveResponseFallback(
    conversationId: string,
    responseText: string
  ): Promise<number> {
    try {
      const existing = await this.loadContextFallback(conversationId);
      const combined = existing + '\n' + responseText;
      const compressed = compressString(combined);
      
      const data = {
        content: compressed,
        timestamp: Date.now(),
        size: compressed.length
      };
      
      await AsyncStorage.setItem(`mongars_cache_${conversationId}`, JSON.stringify(data));
      return 0;
    } catch (error) {
      console.error('Fallback save error:', error);
      return 0;
    }
  }

  private static async getStatsFallback(): Promise<CacheStats> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('mongars_cache_'));
      
      let totalSize = 0;
      for (const key of cacheKeys) {
        const item = await AsyncStorage.getItem(key);
        if (item) {
          totalSize += item.length;
        }
      }
      
      return {
        chunkCount: cacheKeys.length,
        totalSize
      };
    } catch (error) {
      return { chunkCount: 0, totalSize: 0 };
    }
  }

  private static async evictChunksFallback(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('mongars_cache_'));
      
      // Simple eviction: remove oldest entries
      if (cacheKeys.length > 10) {
        const toRemove = cacheKeys.slice(0, Math.floor(cacheKeys.length * 0.3));
        await AsyncStorage.multiRemove(toRemove);
      }
    } catch (error) {
      console.error('Fallback eviction error:', error);
    }
  }
}