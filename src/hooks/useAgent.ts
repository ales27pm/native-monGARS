import { useState, useEffect, useCallback } from 'react';

// Mock implementation for the template environment
// In production, this would import from the actual services

interface AgentState {
  isInitialized: boolean;
  isProcessing: boolean;
  isListening: boolean;
  lastResponse: string | null;
  error: string | null;
}

interface VoiceEvent {
  type: 'wakeWord' | 'speechPartial' | 'speechFinal' | 'error';
  data?: {
    text?: string;
    confidence?: number;
    error?: string;
  };
}

export function useAgent() {
  const [state, setState] = useState<AgentState>({
    isInitialized: true, // Mock as initialized
    isProcessing: false,
    isListening: false,
    lastResponse: null,
    error: null
  });

  const [transcription, setTranscription] = useState<{
    partial: string;
    final: string;
  }>({ partial: '', final: '' });

  // Mock initialization
  useEffect(() => {
    const timer = setTimeout(() => {
      setState(prev => ({
        ...prev,
        isInitialized: true
      }));
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const processInput = useCallback(async (input: string): Promise<string> => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock response based on input
    let response = "I understand you're asking about: " + input;
    
    if (input.toLowerCase().includes('calendar')) {
      response = "I can help you manage your calendar events. You can ask me to create, view, or modify appointments.";
    } else if (input.toLowerCase().includes('contact')) {
      response = "I can help you search and manage your contacts. Would you like me to find someone specific?";
    } else if (input.toLowerCase().includes('file')) {
      response = "I can help you organize and search through your files. What would you like me to do?";
    }

    setState(prev => ({
      ...prev,
      isProcessing: false,
      lastResponse: response
    }));

    return response;
  }, []);

  const startListening = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isListening: true, error: null }));
    return true;
  }, []);

  const stopListening = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isListening: false }));
    return true;
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const getStats = useCallback(() => ({
    initialized: state.isInitialized,
    toolCount: 8,
    maxSteps: 10
  }), [state.isInitialized]);

  return {
    ...state,
    transcription,
    processInput,
    startListening,
    stopListening,
    clearError,
    getStats
  };
}