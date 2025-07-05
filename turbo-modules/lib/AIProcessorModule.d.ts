import type { TurboModule } from 'react-native';
export interface AIProcessorSpec extends TurboModule {
    optimizePrompt(prompt: string): Promise<string>;
    processResponse(response: string, provider: string): Promise<{
        processedText: string;
        confidence: number;
        processingTime: number;
    }>;
    setContext(context: string): Promise<boolean>;
    getContext(): Promise<string>;
    clearContext(): Promise<boolean>;
    preloadModel(modelName: string): Promise<boolean>;
    getModelStatus(modelName: string): Promise<{
        loaded: boolean;
        size: number;
        lastUsed: number;
    }>;
    sanitizeInput(input: string): Promise<string>;
    checkForSensitiveData(text: string): Promise<{
        hasSensitiveData: boolean;
        sensitiveTypes: string[];
    }>;
    cacheResponse(key: string, response: string): Promise<boolean>;
    getCachedResponse(key: string): Promise<string | null>;
    clearCache(): Promise<boolean>;
    getCacheStats(): Promise<{
        size: number;
        hitRate: number;
        totalRequests: number;
    }>;
}
declare const _default: AIProcessorSpec;
export default _default;
