/**
 * Main entry point for monGARS TurboModules.
 * This file exports all native modules and provides convenience hooks for their usage.
 */

// Export all Turbo Modules for direct access
export { default as AIProcessorModule } from './AIProcessorModule';
export { default as VoiceProcessorModule } from './VoiceProcessorModule';
export { default as PrivacyModule } from './PrivacyModule';
export { default as LocalLLMModule } from './LocalLLMModule';
export { default as LocalEmbeddingModule } from './LocalEmbeddingModule';
export { default as ReActToolsModule } from './ReActToolsModule';

// Export types for consumers
export type { AIProcessorSpec } from './AIProcessorModule';
export type { VoiceProcessorSpec } from './VoiceProcessorModule';
export type { PrivacyModuleSpec } from './PrivacyModule';
export type { LocalLLMSpec } from './LocalLLMModule';
export type { LocalEmbeddingSpec } from './LocalEmbeddingModule';
export type { ReActToolsSpec } from './ReActToolsModule';

// Convenience hooks for using the modules
import { useEffect, useState } from 'react';
import AIProcessorModule from './AIProcessorModule';
import VoiceProcessorModule from './VoiceProcessorModule';
import PrivacyModule from './PrivacyModule';
import LocalLLMModule from './LocalLLMModule';
import LocalEmbeddingModule from './LocalEmbeddingModule';
import ReActToolsModule from './ReActToolsModule';

// AI Processor Hook
export const useAIProcessor = () => {
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Initialize AI processor
    const init = async () => {
      try {
        await AIProcessorModule.clearContext();
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize AI Processor:', error);
      }
    };
    
    init();
  }, []);
  
  return {
    isReady,
    ...AIProcessorModule,
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
      } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      console.error('Failed to stop listening:', error);
      return false;
    }
  };
  
  return {
    isReady,
    isListening,
    startListening,
    stopListening,
    ...VoiceProcessorModule,
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
      } catch (error) {
        console.error('Failed to initialize Privacy Module:', error);
      }
    };
    
    init();
  }, []);
  
  return {
    isReady,
    ...PrivacyModule,
  };
};

// Local LLM Hook
export const useLocalLLM = () => {
  const [isReady, setIsReady] = useState(false);
  const [loadedModels, setLoadedModels] = useState<string[]>([]);
  
  useEffect(() => {
    const init = async () => {
      try {
        const models = await LocalLLMModule.getLoadedModels();
        setLoadedModels(models);
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize Local LLM:', error);
      }
    };
    
    init();
  }, []);
  
  const loadModel = async (modelName: string) => {
    try {
      const success = await LocalLLMModule.loadModel(modelName);
      if (success) {
        const models = await LocalLLMModule.getLoadedModels();
        setLoadedModels(models);
      }
      return success;
    } catch (error) {
      console.error('Failed to load model:', error);
      return false;
    }
  };
  
  return {
    isReady,
    loadedModels,
    loadModel,
    ...LocalLLMModule,
  };
};

// Local Embedding Hook
export const useLocalEmbedding = () => {
  const [isReady, setIsReady] = useState(false);
  const [loadedModels, setLoadedModels] = useState<string[]>([]);
  
  useEffect(() => {
    const init = async () => {
      try {
        const models = await LocalEmbeddingModule.getLoadedEmbeddingModels();
        setLoadedModels(models);
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize Local Embedding:', error);
      }
    };
    
    init();
  }, []);
  
  const loadEmbeddingModel = async (modelName: string) => {
    try {
      const success = await LocalEmbeddingModule.loadEmbeddingModel(modelName);
      if (success) {
        const models = await LocalEmbeddingModule.getLoadedEmbeddingModels();
        setLoadedModels(models);
      }
      return success;
    } catch (error) {
      console.error('Failed to load embedding model:', error);
      return false;
    }
  };
  
  return {
    isReady,
    loadedModels,
    loadEmbeddingModel,
    ...LocalEmbeddingModule,
  };
};

// ReAct Tools Hook
export const useReActTools = () => {
  const [isReady, setIsReady] = useState(false);
  const [registeredTools, setRegisteredTools] = useState<Array<{
    id: string;
    name: string;
    description: string;
    enabled: boolean;
  }>>([]);
  
  useEffect(() => {
    const init = async () => {
      try {
        const tools = await ReActToolsModule.getRegisteredTools();
        setRegisteredTools(tools);
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize ReAct Tools:', error);
      }
    };
    
    init();
  }, []);
  
  const registerTool = async (toolName: string, toolFunction: string) => {
    try {
      const result = await ReActToolsModule.registerTool(toolName, toolFunction);
      if (result.success) {
        const tools = await ReActToolsModule.getRegisteredTools();
        setRegisteredTools(tools);
      }
      return result;
    } catch (error) {
      console.error('Failed to register tool:', error);
      return { success: false, error: error.message };
    }
  };
  
  return {
    isReady,
    registeredTools,
    registerTool,
    ...ReActToolsModule,
  };
};