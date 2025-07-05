// Export all Turbo Modules
export { default as AIProcessorModule } from './AIProcessorModule';
export { default as VoiceProcessorModule } from './VoiceProcessorModule';
export { default as PrivacyModule } from './PrivacyModule';
// Convenience hooks for using the modules
import { useEffect, useState } from 'react';
import AIProcessorModule from './AIProcessorModule';
import VoiceProcessorModule from './VoiceProcessorModule';
import PrivacyModule from './PrivacyModule';
// AI Processor Hook
export const useAIProcessor = () => {
    const [isReady, setIsReady] = useState(false);
    useEffect(() => {
        // Initialize AI processor
        const init = async () => {
            try {
                await AIProcessorModule.clearContext();
                setIsReady(true);
            }
            catch (error) {
                console.error('Failed to initialize AI Processor:', error);
            }
        };
        init();
    }, []);
    return {
        isReady,
        optimizePrompt: AIProcessorModule.optimizePrompt,
        processResponse: AIProcessorModule.processResponse,
        setContext: AIProcessorModule.setContext,
        getContext: AIProcessorModule.getContext,
        clearContext: AIProcessorModule.clearContext,
        preloadModel: AIProcessorModule.preloadModel,
        getModelStatus: AIProcessorModule.getModelStatus,
        sanitizeInput: AIProcessorModule.sanitizeInput,
        checkForSensitiveData: AIProcessorModule.checkForSensitiveData,
        cacheResponse: AIProcessorModule.cacheResponse,
        getCachedResponse: AIProcessorModule.getCachedResponse,
        clearCache: AIProcessorModule.clearCache,
        getCacheStats: AIProcessorModule.getCacheStats,
    };
};
// Voice Processor Hook
export const useVoiceProcessor = () => {
    const [isListening, setIsListening] = useState(false);
    const [isReady, setIsReady] = useState(false);
    useEffect(() => {
        const init = async () => {
            try {
                const listening = await VoiceProcessorModule.isListening();
                setIsListening(listening);
                setIsReady(true);
            }
            catch (error) {
                console.error('Failed to initialize Voice Processor:', error);
            }
        };
        init();
    }, []);
    const startListening = async () => {
        try {
            const success = await VoiceProcessorModule.startListening();
            if (success) {
                setIsListening(true);
            }
            return success;
        }
        catch (error) {
            console.error('Failed to start listening:', error);
            return false;
        }
    };
    const stopListening = async () => {
        try {
            const success = await VoiceProcessorModule.stopListening();
            if (success) {
                setIsListening(false);
            }
            return success;
        }
        catch (error) {
            console.error('Failed to stop listening:', error);
            return false;
        }
    };
    return {
        isReady,
        isListening,
        startListening,
        stopListening,
        enableWakeWord: VoiceProcessorModule.enableWakeWord,
        disableWakeWord: VoiceProcessorModule.disableWakeWord,
        isWakeWordEnabled: VoiceProcessorModule.isWakeWordEnabled,
        getWakeWordStatus: VoiceProcessorModule.getWakeWordStatus,
        processAudioBuffer: VoiceProcessorModule.processAudioBuffer,
        enhanceAudio: VoiceProcessorModule.enhanceAudio,
        reduceNoise: VoiceProcessorModule.reduceNoise,
        normalizeVolume: VoiceProcessorModule.normalizeVolume,
        startRealTimeTranscription: VoiceProcessorModule.startRealTimeTranscription,
        stopRealTimeTranscription: VoiceProcessorModule.stopRealTimeTranscription,
        getRealTimeTranscription: VoiceProcessorModule.getRealTimeTranscription,
        registerVoiceCommand: VoiceProcessorModule.registerVoiceCommand,
        unregisterVoiceCommand: VoiceProcessorModule.unregisterVoiceCommand,
        getRegisteredCommands: VoiceProcessorModule.getRegisteredCommands,
        getAudioStats: VoiceProcessorModule.getAudioStats,
        enablePrivateMode: VoiceProcessorModule.enablePrivateMode,
        disablePrivateMode: VoiceProcessorModule.disablePrivateMode,
        isPrivateModeEnabled: VoiceProcessorModule.isPrivateModeEnabled,
    };
};
// Privacy Module Hook
export const usePrivacy = () => {
    const [isReady, setIsReady] = useState(false);
    useEffect(() => {
        const init = async () => {
            try {
                const deviceSecurity = await PrivacyModule.isDeviceSecure();
                setIsReady(true);
                console.log('Privacy module initialized. Device security:', deviceSecurity);
            }
            catch (error) {
                console.error('Failed to initialize Privacy Module:', error);
            }
        };
        init();
    }, []);
    return {
        isReady,
        encryptData: PrivacyModule.encryptData,
        decryptData: PrivacyModule.decryptData,
        generateEncryptionKey: PrivacyModule.generateEncryptionKey,
        secureStore: PrivacyModule.secureStore,
        secureRetrieve: PrivacyModule.secureRetrieve,
        secureDelete: PrivacyModule.secureDelete,
        secureListKeys: PrivacyModule.secureListKeys,
        secureClear: PrivacyModule.secureClear,
        scanForPII: PrivacyModule.scanForPII,
        sanitizeText: PrivacyModule.sanitizeText,
        checkGDPRCompliance: PrivacyModule.checkGDPRCompliance,
        checkCCPACompliance: PrivacyModule.checkCCPACompliance,
        isBiometricAvailable: PrivacyModule.isBiometricAvailable,
        authenticateWithBiometric: PrivacyModule.authenticateWithBiometric,
        isDeviceSecure: PrivacyModule.isDeviceSecure,
        enableVPNMode: PrivacyModule.enableVPNMode,
        disableVPNMode: PrivacyModule.disableVPNMode,
        isVPNActive: PrivacyModule.isVPNActive,
        getPrivacyReport: PrivacyModule.getPrivacyReport,
        checkPermissions: PrivacyModule.checkPermissions,
        requestPermission: PrivacyModule.requestPermission,
    };
};
