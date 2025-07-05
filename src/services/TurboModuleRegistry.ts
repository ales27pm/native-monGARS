/**
 * TurboModule Registry for monGARS Native Modules
 * Simplified registry for the New Architecture implementation
 */

// Mock implementations for development - will be replaced with actual TurboModules in production
const mockModule = {
  // Mock any method calls to prevent crashes during development
} as any;

// Core TurboModules - Safely handled with fallbacks
export const AIProcessorModule = mockModule;
export const VoiceProcessorModule = mockModule;
export const PrivacyModule = mockModule;
export const LocalLLMModule = mockModule;
export const LocalEmbeddingModule = mockModule;
export const ReActToolsModule = mockModule;

// Utility function to check TurboModule availability
export const checkTurboModuleAvailability = () => {
  const modules = {
    AIProcessorModule: false, // Disabled for now
    VoiceProcessorModule: false,
    PrivacyModule: false,
    LocalLLMModule: false,
    LocalEmbeddingModule: false,
    ReActToolsModule: false,
  };
  
  console.log('📱 TurboModule Availability (Development Mode):', modules);
  return modules;
};

// Simplified initialization for New Architecture
export const initializeTurboModules = async () => {
  try {
    console.log('🚀 TurboModules running in development mode...');
    
    // In development, we'll use mock implementations
    console.log('⚠️ Using mock TurboModules for development');
    
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