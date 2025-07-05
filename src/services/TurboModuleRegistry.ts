/**
 * TurboModule Registry for monGARS Native Modules
 * Production-ready registry for the New Architecture implementation
 */

import { TurboModuleRegistry, Platform } from 'react-native';
import type {
  AIProcessorSpec,
  VoiceProcessorSpec,
  PrivacyModuleSpec,
  LocalLLMSpec,
  LocalEmbeddingSpec,
  ReActToolsSpec
} from '../../turbo-modules/src';

// Core TurboModules - Modern React Native New Architecture
let AIProcessorModule: AIProcessorSpec | null = null;
let VoiceProcessorModule: VoiceProcessorSpec | null = null;
let PrivacyModule: PrivacyModuleSpec | null = null;
let LocalLLMModule: LocalLLMSpec | null = null;
let LocalEmbeddingModule: LocalEmbeddingSpec | null = null;
let ReActToolsModule: ReActToolsSpec | null = null;

// Safe module loading with fallbacks
const safeGetModule = <T>(moduleName: string): T | null => {
  try {
    if (Platform.OS === 'ios') {
      return TurboModuleRegistry.getEnforcing<T>(moduleName);
    } else {
      console.warn(`⚠️ TurboModule ${moduleName} only available on iOS`);
      return null;
    }
  } catch (error) {
    console.warn(`⚠️ TurboModule ${moduleName} not available:`, error.message);
    return null;
  }
};

// Initialize modules
try {
  AIProcessorModule = safeGetModule<AIProcessorSpec>('AIProcessorModule');
  VoiceProcessorModule = safeGetModule<VoiceProcessorSpec>('VoiceProcessorModule');
  PrivacyModule = safeGetModule<PrivacyModuleSpec>('PrivacyModule');
  LocalLLMModule = safeGetModule<LocalLLMSpec>('LocalLLMModule');
  LocalEmbeddingModule = safeGetModule<LocalEmbeddingSpec>('LocalEmbeddingModule');
  ReActToolsModule = safeGetModule<ReActToolsSpec>('ReActToolsModule');
} catch (error) {
  console.error('❌ Failed to load TurboModules:', error);
}

// Utility function to check TurboModule availability
export const checkTurboModuleAvailability = () => {
  const modules = {
    AIProcessorModule: !!AIProcessorModule,
    VoiceProcessorModule: !!VoiceProcessorModule,
    PrivacyModule: !!PrivacyModule,
    LocalLLMModule: !!LocalLLMModule,
    LocalEmbeddingModule: !!LocalEmbeddingModule,
    ReActToolsModule: !!ReActToolsModule,
  };
  
  console.log('📱 TurboModule Availability:', modules);
  return modules;
};

// Production initialization for New Architecture
export const initializeTurboModules = async () => {
  try {
    console.log('🚀 Initializing TurboModules with New Architecture...');
    
    // Check availability
    const availability = checkTurboModuleAvailability();
    
    // Initialize Local LLM if available
    if (LocalLLMModule) {
      try {
        // Don't auto-load models - let user choose via the interface
        console.log('✅ Local LLM module available');
      } catch (error) {
        console.warn('⚠️ Local LLM initialization failed:', error);
      }
    }
    
    // Initialize other modules
    if (AIProcessorModule) {
      try {
        await AIProcessorModule.clearContext();
        console.log('✅ AI Processor initialized');
      } catch (error) {
        console.warn('⚠️ AI Processor initialization failed:', error);
      }
    }
    
    const availableCount = Object.values(availability).filter(Boolean).length;
    console.log(`✅ ${availableCount}/6 TurboModules available`);
    
    return true;
  } catch (error) {
    console.error('❌ TurboModule initialization failed:', error);
    return false;
  }
};

export {
  AIProcessorModule,
  VoiceProcessorModule,
  PrivacyModule,
  LocalLLMModule,
  LocalEmbeddingModule,
  ReActToolsModule,
};

export default {
  AIProcessorModule,
  VoiceProcessorModule,
  PrivacyModule,
  LocalLLMModule,
  LocalEmbeddingModule,
  ReActToolsModule,
  checkTurboModuleAvailability,
  initializeTurboModules,
};