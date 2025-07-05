import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VoiceRecording, VoiceStats } from '../services/VoiceService';

interface VoiceState {
  recordings: VoiceRecording[];
  wakeWordEnabled: boolean;
  stats: VoiceStats;
  addRecording: (recording: VoiceRecording) => void;
  deleteRecording: (id: string) => void;
  updateRecording: (id: string, updates: Partial<VoiceRecording>) => void;
  setWakeWordEnabled: (enabled: boolean) => void;
  setStats: (stats: VoiceStats) => void;
  clearAllRecordings: () => void;
}

const defaultStats: VoiceStats = {
  initialized: false,
  listening: false,
  wakeWordEnabled: false,
  recordingsCount: 0,
  totalDuration: 0,
};

const useVoiceStore = create<VoiceState>()(
  persist(
    (set, get) => ({
      recordings: [],
      wakeWordEnabled: false,
      stats: defaultStats,

      addRecording: (recording) =>
        set((state) => ({ recordings: [recording, ...state.recordings].slice(0, 20) })), // Keep last 20

      deleteRecording: (id) =>
        set((state) => ({
          recordings: state.recordings.filter((r) => r.id !== id),
        })),

      updateRecording: (id, updates) =>
        set((state) => ({
          recordings: state.recordings.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),

      setWakeWordEnabled: (enabled) => set({ wakeWordEnabled: enabled }),
      setStats: (stats) => set({ stats }),
      clearAllRecordings: () => set({ recordings: [] }),
    }),
    {
      name: "voice-storage",
      storage: createJSONStorage(() => AsyncStorage, {
        reviver: (key, value: any) => {
          if (key === 'timestamp' || key === 'lastRecording') {
            return value ? new Date(value) : null;
          }
          if (key === 'recordings' && Array.isArray(value)) {
            return value.map(r => ({ ...r, timestamp: new Date(r.timestamp) }));
          }
          return value;
        },
      }),
      partialize: (state) => ({
        recordings: state.recordings,
        wakeWordEnabled: state.wakeWordEnabled,
      }),
    }
  )
);

export default useVoiceStore;