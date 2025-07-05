import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface VoiceProcessorSpec extends TurboModule {
  // Voice Recognition
  startListening(): Promise<boolean>;
  stopListening(): Promise<boolean>;
  isListening(): Promise<boolean>;
  
  // Wake Word Detection
  enableWakeWord(wakeWord: string): Promise<boolean>;
  disableWakeWord(): Promise<boolean>;
  isWakeWordEnabled(): Promise<boolean>;
  getWakeWordStatus(): Promise<{
    enabled: boolean;
    word: string;
    sensitivity: number;
    detectionCount: number;
  }>;
  
  // Audio Processing
  processAudioBuffer(buffer: ArrayBuffer): Promise<{
    transcription: string;
    confidence: number;
    duration: number;
  }>;
  
  // Voice Enhancement
  enhanceAudio(buffer: ArrayBuffer): Promise<ArrayBuffer>;
  reduceNoise(buffer: ArrayBuffer, level: number): Promise<ArrayBuffer>;
  normalizeVolume(buffer: ArrayBuffer): Promise<ArrayBuffer>;
  
  // Real-time Features
  startRealTimeTranscription(): Promise<boolean>;
  stopRealTimeTranscription(): Promise<boolean>;
  getRealTimeTranscription(): Promise<{
    partial: string;
    final: string;
    confidence: number;
  }>;
  
  // Voice Commands
  registerVoiceCommand(command: string, action: string): Promise<boolean>;
  unregisterVoiceCommand(command: string): Promise<boolean>;
  getRegisteredCommands(): Promise<string[]>;
  
  // Audio Stats
  getAudioStats(): Promise<{
    sampleRate: number;
    bitDepth: number;
    channels: number;
    averageVolume: number;
    noiseLevel: number;
  }>;
  
  // Privacy Features
  enablePrivateMode(): Promise<boolean>;
  disablePrivateMode(): Promise<boolean>;
  isPrivateModeEnabled(): Promise<boolean>;
}

export default TurboModuleRegistry.getEnforcing<VoiceProcessorSpec>('VoiceProcessorModule');