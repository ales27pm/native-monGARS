import type { TurboModule } from 'react-native';
export interface VoiceProcessorSpec extends TurboModule {
    startListening(): Promise<boolean>;
    stopListening(): Promise<boolean>;
    isListening(): Promise<boolean>;
    enableWakeWord(wakeWord: string): Promise<boolean>;
    disableWakeWord(): Promise<boolean>;
    isWakeWordEnabled(): Promise<boolean>;
    getWakeWordStatus(): Promise<{
        enabled: boolean;
        word: string;
        sensitivity: number;
        detectionCount: number;
    }>;
    processAudioBuffer(buffer: ArrayBuffer): Promise<{
        transcription: string;
        confidence: number;
        duration: number;
    }>;
    enhanceAudio(buffer: ArrayBuffer): Promise<ArrayBuffer>;
    reduceNoise(buffer: ArrayBuffer, level: number): Promise<ArrayBuffer>;
    normalizeVolume(buffer: ArrayBuffer): Promise<ArrayBuffer>;
    startRealTimeTranscription(): Promise<boolean>;
    stopRealTimeTranscription(): Promise<boolean>;
    getRealTimeTranscription(): Promise<{
        partial: string;
        final: string;
        confidence: number;
    }>;
    registerVoiceCommand(command: string, action: string): Promise<boolean>;
    unregisterVoiceCommand(command: string): Promise<boolean>;
    getRegisteredCommands(): Promise<string[]>;
    getAudioStats(): Promise<{
        sampleRate: number;
        bitDepth: number;
        channels: number;
        averageVolume: number;
        noiseLevel: number;
    }>;
    enablePrivateMode(): Promise<boolean>;
    disablePrivateMode(): Promise<boolean>;
    isPrivateModeEnabled(): Promise<boolean>;
}
declare const _default: VoiceProcessorSpec;
export default _default;
