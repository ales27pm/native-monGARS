/**
 * TurboModule Registry for monGARS Native Modules
 * Simplified registry for the New Architecture implementation
 */

import { TurboModuleRegistry } from 'react-native';
import type {
  AIProcessorSpec,
  VoiceProcessorSpec,
  PrivacyModuleSpec,
  LocalLLMSpec,
  LocalEmbeddingSpec,
  ReActToolsSpec
} from '../../turbo-modules/src';

// Core TurboModules - Modern React Native New Architecture
export const AIProcessorModule = TurboModuleRegistry.getEnforcing<AIProcessorSpec>('AIProcessorModule');
export const VoiceProcessorModule = TurboModuleRegistry.getEnforcing<VoiceProcessorSpec>('VoiceProcessorModule');
export const PrivacyModule = TurboModuleRegistry.getEnforcing<PrivacyModuleSpec>('PrivacyModule');
export const LocalLLMModule = TurboModuleRegistry.getEnforcing<LocalLLMSpec>('LocalLLMModule');
export const LocalEmbeddingModule = TurboModuleRegistry.getEnforcing<LocalEmbeddingSpec>('LocalEmbeddingModule');
export const ReActToolsModule = TurboModuleRegistry.getEnforcing<ReActToolsSpec>('ReActToolsModule');

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

// Simplified initialization for New Architecture
export const initializeTurboModules = async () => {
  try {
    console.log('🚀 Initializing TurboModules with New Architecture...');
    
    // Check availability
    const availability = checkTurboModuleAvailability();
    
    // All modules are automatically available with the New Architecture
    // No manual initialization required - handled by the native implementations
    
    const availableCount = Object.values(availability).filter(Boolean).length;
    console.log(`✅ ${availableCount}/6 TurboModules initialized successfully!`);
    
    return true;
  } catch (error) {
    console.error('❌ TurboModule initialization failed:', error);
    return false;
  }
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