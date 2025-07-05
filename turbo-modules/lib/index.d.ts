export { default as AIProcessorModule } from './AIProcessorModule';
export { default as VoiceProcessorModule } from './VoiceProcessorModule';
export { default as PrivacyModule } from './PrivacyModule';
export type { AIProcessorSpec } from './AIProcessorModule';
export type { VoiceProcessorSpec } from './VoiceProcessorModule';
export type { PrivacyModuleSpec } from './PrivacyModule';
export declare const useAIProcessor: () => {
    isReady: boolean;
    optimizePrompt: (prompt: string) => Promise<string>;
    processResponse: (response: string, provider: string) => Promise<{
        processedText: string;
        confidence: number;
        processingTime: number;
    }>;
    setContext: (context: string) => Promise<boolean>;
    getContext: () => Promise<string>;
    clearContext: () => Promise<boolean>;
    preloadModel: (modelName: string) => Promise<boolean>;
    getModelStatus: (modelName: string) => Promise<{
        loaded: boolean;
        size: number;
        lastUsed: number;
    }>;
    sanitizeInput: (input: string) => Promise<string>;
    checkForSensitiveData: (text: string) => Promise<{
        hasSensitiveData: boolean;
        sensitiveTypes: string[];
    }>;
    cacheResponse: (key: string, response: string) => Promise<boolean>;
    getCachedResponse: (key: string) => Promise<string | null>;
    clearCache: () => Promise<boolean>;
    getCacheStats: () => Promise<{
        size: number;
        hitRate: number;
        totalRequests: number;
    }>;
};
export declare const useVoiceProcessor: () => {
    isReady: boolean;
    isListening: boolean;
    startListening: () => Promise<boolean>;
    stopListening: () => Promise<boolean>;
    enableWakeWord: (wakeWord: string) => Promise<boolean>;
    disableWakeWord: () => Promise<boolean>;
    isWakeWordEnabled: () => Promise<boolean>;
    getWakeWordStatus: () => Promise<{
        enabled: boolean;
        word: string;
        sensitivity: number;
        detectionCount: number;
    }>;
    processAudioBuffer: (buffer: ArrayBuffer) => Promise<{
        transcription: string;
        confidence: number;
        duration: number;
    }>;
    enhanceAudio: (buffer: ArrayBuffer) => Promise<ArrayBuffer>;
    reduceNoise: (buffer: ArrayBuffer, level: number) => Promise<ArrayBuffer>;
    normalizeVolume: (buffer: ArrayBuffer) => Promise<ArrayBuffer>;
    startRealTimeTranscription: () => Promise<boolean>;
    stopRealTimeTranscription: () => Promise<boolean>;
    getRealTimeTranscription: () => Promise<{
        partial: string;
        final: string;
        confidence: number;
    }>;
    registerVoiceCommand: (command: string, action: string) => Promise<boolean>;
    unregisterVoiceCommand: (command: string) => Promise<boolean>;
    getRegisteredCommands: () => Promise<string[]>;
    getAudioStats: () => Promise<{
        sampleRate: number;
        bitDepth: number;
        channels: number;
        averageVolume: number;
        noiseLevel: number;
    }>;
    enablePrivateMode: () => Promise<boolean>;
    disablePrivateMode: () => Promise<boolean>;
    isPrivateModeEnabled: () => Promise<boolean>;
};
export declare const usePrivacy: () => {
    isReady: boolean;
    encryptData: (data: string, key?: string) => Promise<string>;
    decryptData: (encryptedData: string, key?: string) => Promise<string>;
    generateEncryptionKey: () => Promise<string>;
    secureStore: (key: string, value: string) => Promise<boolean>;
    secureRetrieve: (key: string) => Promise<string | null>;
    secureDelete: (key: string) => Promise<boolean>;
    secureListKeys: () => Promise<string[]>;
    secureClear: () => Promise<boolean>;
    scanForPII: (text: string) => Promise<{
        foundPII: boolean;
        types: string[];
        locations: Array<{
            type: string;
            start: number;
            end: number;
            value: string;
        }>;
    }>;
    sanitizeText: (text: string, options?: {
        removePII?: boolean;
        anonymize?: boolean;
        redactSensitive?: boolean;
    }) => Promise<string>;
    checkGDPRCompliance: (data: string) => Promise<{
        compliant: boolean;
        issues: string[];
        recommendations: string[];
    }>;
    checkCCPACompliance: (data: string) => Promise<{
        compliant: boolean;
        issues: string[];
        recommendations: string[];
    }>;
    isBiometricAvailable: () => Promise<boolean>;
    authenticateWithBiometric: () => Promise<{
        success: boolean;
        error?: string;
    }>;
    isDeviceSecure: () => Promise<{
        isSecure: boolean;
        hasScreenLock: boolean;
        isJailbroken: boolean;
        hasEncryption: boolean;
    }>;
    enableVPNMode: () => Promise<boolean>;
    disableVPNMode: () => Promise<boolean>;
    isVPNActive: () => Promise<boolean>;
    getPrivacyReport: () => Promise<{
        dataStored: number;
        encryptedItems: number;
        lastAudit: number;
        securityScore: number;
        recommendations: string[];
    }>;
    checkPermissions: () => Promise<{
        camera: boolean;
        microphone: boolean;
        storage: boolean;
        location: boolean;
        contacts: boolean;
    }>;
    requestPermission: (permission: string) => Promise<boolean>;
};
