/**
 * TurboModule Registry for monGARS Native Modules
 * Provides typed access to all native iOS functionality
 */

import { TurboModuleRegistry } from 'react-native';
import type {
  WakeWordDetectionSpec,
  VectorStoreSpec,
  SpeechSynthesisSpec,
  FileManagerSpec,
  LocalLLMSpec,
  LocalEmbeddingSpec,
  ReActToolsSpec
} from '../types/NativeModules';

// TurboModule Registry - Modern React Native 0.76+ approach
export const WakeWordDetection = TurboModuleRegistry.getEnforcing<WakeWordDetectionSpec>('WakeWordDetection');
export const VectorStore = TurboModuleRegistry.getEnforcing<VectorStoreSpec>('VectorStore');
export const SpeechSynthesis = TurboModuleRegistry.getEnforcing<SpeechSynthesisSpec>('SpeechSynthesis');
export const FileManager = TurboModuleRegistry.getEnforcing<FileManagerSpec>('FileManager');

// Local LLM and RAG Modules
export const LocalLLM = TurboModuleRegistry.getEnforcing<LocalLLMSpec>('LocalLLM');
export const LocalEmbedding = TurboModuleRegistry.getEnforcing<LocalEmbeddingSpec>('LocalEmbedding');

// ReAct Tools
export const ReActTools = TurboModuleRegistry.getEnforcing<ReActToolsSpec>('ReActTools');

// Utility function to check TurboModule availability
export const checkTurboModuleAvailability = () => {
  const modules = {
    WakeWordDetection: !!WakeWordDetection,
    VectorStore: !!VectorStore,
    SpeechSynthesis: !!SpeechSynthesis,
    FileManager: !!FileManager,
    LocalLLM: !!LocalLLM,
    LocalEmbedding: !!LocalEmbedding,
    ReActTools: !!ReActTools,
  };
  
  console.log('📱 TurboModule Availability:', modules);
  return modules;
};

// Initialize all TurboModules
export const initializeTurboModules = async () => {
  try {
    console.log('🚀 Initializing TurboModules...');
    
    // Check availability
    const availability = checkTurboModuleAvailability();
    
    // Initialize Vector Store
    if (availability.VectorStore) {
      await VectorStore.initialize(1536, 'HNSW'); // OpenAI embedding dimensions
      console.log('✅ VectorStore initialized');
    }
    
    // Set up Wake Word Detection
    if (availability.WakeWordDetection) {
      await WakeWordDetection.setSensitivity(0.8);
      await WakeWordDetection.setWakeWords(['hey mongars', 'mongars']);
      console.log('✅ WakeWordDetection configured');
    }
    
    // Configure Speech Synthesis
    if (availability.SpeechSynthesis) {
      await SpeechSynthesis.setDefaultVoice('com.apple.voice.enhanced.en-US.Alex');
      await SpeechSynthesis.setSpeechRate(0.5);
      console.log('✅ SpeechSynthesis configured');
    }
    
    // Initialize Local LLM modules
    if (availability.LocalLLM) {
      console.log('✅ LocalLLM module available');
    }
    
    if (availability.LocalEmbedding) {
      console.log('✅ LocalEmbedding module available');
    }
    
    if (availability.ReActTools) {
      console.log('✅ ReActTools module available');
    }
    
    console.log('🎉 All TurboModules initialized successfully!');
    return true;
  } catch (error) {
    console.error('❌ TurboModule initialization failed:', error);
    return false;
  }
};

export default {
  WakeWordDetection,
  VectorStore,
  SpeechSynthesis,
  FileManager,
  LocalLLM,
  LocalEmbedding,
  ReActTools,
  checkTurboModuleAvailability,
  initializeTurboModules,
};