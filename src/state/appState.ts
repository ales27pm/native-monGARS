import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AssistantMessage } from '../types/core';

interface AppState {
  // Authentication
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  
  // Messages
  messages: AssistantMessage[];
  isGenerating: boolean;
  
  // Settings
  isDarkMode: boolean;
  ttsEnabled: boolean;
  biometricEnabled: boolean;
  
  // Actions
  setAuthenticated: (authenticated: boolean) => void;
  setOnboardingComplete: (complete: boolean) => void;
  addMessage: (message: AssistantMessage) => void;
  updateLastMessage: (content: string) => void;
  clearMessages: () => void;
  setGenerating: (generating: boolean) => void;
  setDarkMode: (dark: boolean) => void;
  setTTSEnabled: (enabled: boolean) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  resetApp: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      hasCompletedOnboarding: false,
      messages: [],
      isGenerating: false,
      isDarkMode: false,
      ttsEnabled: true,
      biometricEnabled: true,

      // Actions
      setAuthenticated: (authenticated) => 
        set({ isAuthenticated: authenticated }),
      
      setOnboardingComplete: (complete) => 
        set({ hasCompletedOnboarding: complete }),
      
      addMessage: (message) => 
        set((state) => ({ 
          messages: [...state.messages, message] 
        })),
      
      updateLastMessage: (content) => 
        set((state) => ({
          messages: state.messages.map((msg, index) => 
            index === state.messages.length - 1 
              ? { ...msg, content }
              : msg
          )
        })),
      
      clearMessages: () => 
        set({ messages: [] }),
      
      setGenerating: (generating) => 
        set({ isGenerating: generating }),
      
      setDarkMode: (dark) => 
        set({ isDarkMode: dark }),
      
      setTTSEnabled: (enabled) => 
        set({ ttsEnabled: enabled }),
      
      setBiometricEnabled: (enabled) => 
        set({ biometricEnabled: enabled }),
        
      resetApp: () => 
        set({
          isAuthenticated: false,
          hasCompletedOnboarding: false,
          messages: [],
          isGenerating: false,
          isDarkMode: false,
          ttsEnabled: true,
          biometricEnabled: true,
        })
    }),
    {
      name: 'mongars-app-state',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        isDarkMode: state.isDarkMode,
        ttsEnabled: state.ttsEnabled,
        biometricEnabled: state.biometricEnabled,
      }),
    }
  )
);