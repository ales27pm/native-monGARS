import { Audio, AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { transcribeAudio } from '../api/transcribe-audio';

export interface VoiceRecording {
  id: string;
  uri: string;
  duration: number;
  timestamp: Date;
  transcription?: string;
}

export interface VoiceStats {
  initialized: boolean;
  listening: boolean;
  wakeWordEnabled: boolean;
  recordingsCount: number;
  totalDuration: number;
  lastRecording?: Date;
}

export class VoiceService {
  private static instance: VoiceService;
  private recording: Audio.Recording | null = null;
  private isListening = false;
  private isInitialized = false;
  private wakeWordEnabled = false;
  private recordings: VoiceRecording[] = [];
  private permissionGranted = false;

  static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService();
    }
    return VoiceService.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Request permissions
      const permission = await Audio.requestPermissionsAsync();
      this.permissionGranted = permission.status === 'granted';

      if (!this.permissionGranted) {
        console.warn('Audio permissions not granted');
        return false;
      }

      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing voice service:', error);
      return false;
    }
  }

  async startRecording(): Promise<boolean> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) return false;
    }

    if (this.isListening) {
      console.warn('Already recording');
      return false;
    }

    try {
      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.MAX,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });

      await this.recording.startAsync();
      this.isListening = true;
      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      this.recording = null;
      return false;
    }
  }

  async stopRecording(): Promise<VoiceRecording | null> {
    if (!this.isListening || !this.recording) {
      console.warn('Not currently recording');
      return null;
    }

    try {
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      
      if (!uri) {
        console.error('No recording URI available');
        return null;
      }

      // Get recording info
      const info = await FileSystem.getInfoAsync(uri);
      const duration = await this.getRecordingDuration(uri);

      const voiceRecording: VoiceRecording = {
        id: `recording_${Date.now()}_${Math.random().toString(36).substring(2, 9).replace(/[^a-zA-Z0-9]/g, 'x')}`,
        uri,
        duration,
        timestamp: new Date(),
      };

      this.recordings.push(voiceRecording);
      this.recording = null;
      this.isListening = false;

      return voiceRecording;
    } catch (error) {
      console.error('Error stopping recording:', error);
      this.recording = null;
      this.isListening = false;
      return null;
    }
  }

  private async getRecordingDuration(uri: string): Promise<number> {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri });
      const status = await sound.getStatusAsync();
      await sound.unloadAsync();
      
      if (status.isLoaded) {
        return status.durationMillis || 0;
      }
      return 0;
    } catch (error) {
      console.error('Error getting recording duration:', error);
      return 0;
    }
  }

  async transcribeRecording(recording: VoiceRecording): Promise<string> {
    try {
      // Use the URI directly as the transcription API expects
      const transcription = await transcribeAudio(recording.uri);
      
      // Update the recording with transcription
      const index = this.recordings.findIndex(r => r.id === recording.id);
      if (index !== -1) {
        this.recordings[index].transcription = transcription;
      }

      return transcription;
    } catch (error) {
      console.error('Error transcribing recording:', error);
      throw error;
    }
  }

  async playRecording(recording: VoiceRecording): Promise<void> {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: recording.uri });
      await sound.playAsync();
      
      // Unload after playing
      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('Error playing recording:', error);
      throw error;
    }
  }

  async deleteRecording(recordingId: string): Promise<void> {
    const index = this.recordings.findIndex(r => r.id === recordingId);
    if (index === -1) {
      throw new Error(`Recording with ID ${recordingId} not found`);
    }

    const recording = this.recordings[index];
    
    try {
      // Delete the file
      await FileSystem.deleteAsync(recording.uri, { idempotent: true });
      
      // Remove from recordings array
      this.recordings.splice(index, 1);
    } catch (error) {
      console.error('Error deleting recording:', error);
      throw error;
    }
  }

  async clearAllRecordings(): Promise<void> {
    try {
      // Delete all recording files
      await Promise.all(
        this.recordings.map(recording =>
          FileSystem.deleteAsync(recording.uri, { idempotent: true })
        )
      );
      
      // Clear recordings array
      this.recordings = [];
    } catch (error) {
      console.error('Error clearing recordings:', error);
      throw error;
    }
  }

  getRecordings(): VoiceRecording[] {
    return [...this.recordings];
  }

  getRecordingById(id: string): VoiceRecording | null {
    return this.recordings.find(r => r.id === id) || null;
  }

  isRecording(): boolean {
    return this.isListening;
  }

  isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  setWakeWordEnabled(enabled: boolean): void {
    this.wakeWordEnabled = enabled;
    // TODO: Implement actual wake word detection
  }

  isWakeWordEnabled(): boolean {
    return this.wakeWordEnabled;
  }

  getStats(): VoiceStats {
    const totalDuration = this.recordings.reduce((sum, recording) => 
      sum + recording.duration, 0
    );
    
    const lastRecording = this.recordings.length > 0
      ? this.recordings[this.recordings.length - 1].timestamp
      : undefined;

    return {
      initialized: this.isInitialized,
      listening: this.isListening,
      wakeWordEnabled: this.wakeWordEnabled,
      recordingsCount: this.recordings.length,
      totalDuration,
      lastRecording,
    };
  }

  async quickTranscribe(): Promise<string> {
    // Start recording
    const started = await this.startRecording();
    if (!started) {
      throw new Error('Failed to start recording');
    }

    // Record for 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Stop recording
    const recording = await this.stopRecording();
    if (!recording) {
      throw new Error('Failed to stop recording');
    }

    // Transcribe
    const transcription = await this.transcribeRecording(recording);
    
    // Clean up the recording after transcription
    await this.deleteRecording(recording.id);

    return transcription;
  }
}