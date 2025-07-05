import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  preferredAIProvider: 'anthropic' | 'openai' | 'grok';
  temperature: number;
  maxTokens: number;
  voiceEnabled: boolean;
  wakeWordEnabled: boolean;
  voiceLanguage: string;
  privacyMode: boolean;
  autoSaveConversations: boolean;
  notificationsEnabled: boolean;
  hapticFeedback: boolean;
}

export interface ServiceStatus {
  anthropic: {
    available: boolean;
    lastChecked: Date | null;
    error: string | null;
  };
  openai: {
    available: boolean;
    lastChecked: Date | null;
    error: string | null;
  };
  grok: {
    available: boolean;
    lastChecked: Date | null;
    error: string | null;
  };
  voice: {
    available: boolean;
    lastChecked: Date | null;
    error: string | null;
  };
}

interface AppState {
  // App settings
  settings: AppSettings;
  
  // Service status
  serviceStatus: ServiceStatus;
  
  // App state
  isInitialized: boolean;
  isOffline: boolean;
  lastActiveTab: string | null;
  
  // Actions
  updateSettings: (updates: Partial<AppSettings>) => void;
  updateServiceStatus: (service: keyof ServiceStatus, status: Partial<ServiceStatus[keyof ServiceStatus]>) => void;
  setInitialized: (initialized: boolean) => void;
  setOffline: (offline: boolean) => void;
  setLastActiveTab: (tab: string) => void;
  
  // Computed
  getAvailableServices: () => Array<keyof ServiceStatus>;
  getServiceCount: () => number;
  isServiceAvailable: (service: keyof ServiceStatus) => boolean;
  
  // Utility
  resetSettings: () => void;
  checkAllServices: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  theme: 'system',
  preferredAIProvider: 'anthropic',
  temperature: 0.7,
  maxTokens: 2048,
  voiceEnabled: true,
  wakeWordEnabled: false,
  voiceLanguage: 'en-US',
  privacyMode: true,
  autoSaveConversations: true,
  notificationsEnabled: true,
  hapticFeedback: true,
};

const defaultServiceStatus: ServiceStatus = {
  anthropic: { available: false, lastChecked: null, error: null },
  openai: { available: false, lastChecked: null, error: null },
  grok: { available: false, lastChecked: null, error: null },
  voice: { available: false, lastChecked: null, error: null },
};

const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      settings: defaultSettings,
      serviceStatus: defaultServiceStatus,
      isInitialized: false,
      isOffline: false,
      lastActiveTab: null,
      
      // Actions
      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),
      
      updateServiceStatus: (service, status) =>
        set((state) => ({
          serviceStatus: {
            ...state.serviceStatus,
            [service]: { ...state.serviceStatus[service], ...status },
          },
        })),
      
      setInitialized: (initialized) => set({ isInitialized: initialized }),
      setOffline: (offline) => set({ isOffline: offline }),
      setLastActiveTab: (tab) => set({ lastActiveTab: tab }),
      
      // Computed
      getAvailableServices: () => {
        const { serviceStatus } = get();
        return Object.keys(serviceStatus).filter(service => 
          serviceStatus[service as keyof ServiceStatus].available
        ) as Array<keyof ServiceStatus>;
      },
      
      getServiceCount: () => get().getAvailableServices().length,
      
      isServiceAvailable: (service) => get().serviceStatus[service].available,
      
      // Utility
      resetSettings: () => set({ settings: defaultSettings }),
      
      checkAllServices: async () => {
        const now = new Date();
        
        // Check if API keys are available
        const anthropicAvailable = !!process.env.EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY;
        const openaiAvailable = !!process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;
        const grokAvailable = !!process.env.EXPO_PUBLIC_VIBECODE_GROK_API_KEY;
        const voiceAvailable = true; // Voice is always available
        
        set((state) => ({
          serviceStatus: {
            anthropic: { available: anthropicAvailable, lastChecked: now, error: null },
            openai: { available: openaiAvailable, lastChecked: now, error: null },
            grok: { available: grokAvailable, lastChecked: now, error: null },
            voice: { available: voiceAvailable, lastChecked: now, error: null },
          },
        }));
      },
    }),
    {
      name: "app-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        settings: state.settings,
        lastActiveTab: state.lastActiveTab,
      }),
    }
  )
);

export default useAppStore;