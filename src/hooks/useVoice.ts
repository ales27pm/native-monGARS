import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { VoiceService, VoiceRecording } from '../services/VoiceService';
import useVoiceStore from '../state/voiceStore';
import { logger } from '../utils/logger';

export const useVoice = () => {
  const voiceService = VoiceService.getInstance();
  const { 
    recordings,
    addRecording,
    deleteRecording,
    updateRecording,
    setStats,
    stats,
    wakeWordEnabled,
    setWakeWordEnabled,
    clearAllRecordings,
  } = useVoiceStore();

  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);

  const initialize = useCallback(async () => {
    try {
      const success = await voiceService.initialize();
      if (!success) {
        setError("Failed to initialize voice service. Check permissions.");
        logger.error("useVoice", "Initialization failed");
      }
      loadStats();
    } catch (e) {
      setError("An error occurred during voice service initialization.");
      logger.error("useVoice", "Initialization error", e);
    }
  }, [voiceService]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const loadStats = useCallback(() => {
    setStats(voiceService.getStats());
  }, [voiceService, setStats]);

  const handleStartListening = useCallback(async () => {
    setError(null);
    setTranscription(null);
    setIsProcessing(true);
    try {
      const success = await voiceService.startRecording();
      if (success) {
        setIsListening(true);
      } else {
        setError('Failed to start recording. Please check microphone permissions.');
      }
    } catch (e) {
      const err = e as Error;
      setError(err.message);
      logger.error('useVoice', 'Start listening failed', err);
    } finally {
      setIsProcessing(false);
    }
  }, [voiceService]);

  const handleStopListening = useCallback(async () => {
    if (!isListening) return;

    setIsProcessing(true);
    try {
      const recording = await voiceService.stopRecording();
      setIsListening(false);
      
      if (recording) {
        addRecording(recording);
        loadStats();
        
        // Transcribe automatically
        const transcriptionText = await voiceService.transcribeRecording(recording);
        setTranscription(transcriptionText);
        updateRecording(recording.id, { transcription: transcriptionText });
      }
    } catch (e) {
      const err = e as Error;
      setError(err.message);
      logger.error('useVoice', 'Stop listening failed', err);
    } finally {
      setIsProcessing(false);
    }
  }, [voiceService, isListening, addRecording, updateRecording, loadStats]);

  const handleToggleWakeWord = useCallback(async () => {
    const newValue = !wakeWordEnabled;
    voiceService.setWakeWordEnabled(newValue);
    setWakeWordEnabled(newValue);
    logger.info('useVoice', `Wake word toggled to: ${newValue}`);
  }, [wakeWordEnabled, voiceService, setWakeWordEnabled]);

  const handlePlayRecording = useCallback(async (recording: VoiceRecording) => {
    try {
      await voiceService.playRecording(recording);
    } catch (e) {
      const err = e as Error;
      Alert.alert("Playback Error", err.message);
      logger.error('useVoice', 'Playback failed', err);
    }
  }, [voiceService]);

  const handleDeleteRecording = useCallback(async (id: string) => {
    try {
      await voiceService.deleteRecording(id);
      deleteRecording(id);
      loadStats();
    } catch (e) {
      const err = e as Error;
      Alert.alert("Delete Error", err.message);
      logger.error('useVoice', 'Delete recording failed', err);
    }
  }, [voiceService, deleteRecording, loadStats]);

  const handleQuickTranscribe = useCallback(async () => {
    setError(null);
    setTranscription(null);
    setIsProcessing(true);
    try {
      const transcriptionText = await voiceService.quickTranscribe();
      setTranscription(transcriptionText);
      loadStats();
    } catch (e) {
      const err = e as Error;
      setError(err.message);
      logger.error('useVoice', 'Quick transcribe failed', err);
    } finally {
      setIsProcessing(false);
    }
  }, [voiceService, loadStats]);

  const handleTranscribeRecording = useCallback(async (recording: VoiceRecording) => {
    setIsProcessing(true);
    try {
      const transcriptionText = await voiceService.transcribeRecording(recording);
      setTranscription(transcriptionText);
      updateRecording(recording.id, { transcription: transcriptionText });
    } catch (e) {
      const err = e as Error;
      setError(err.message);
      logger.error('useVoice', 'Transcribe recording failed', err);
    } finally {
      setIsProcessing(false);
    }
  }, [voiceService, updateRecording]);

  // Periodic stats updates
  useEffect(() => {
    const interval = setInterval(loadStats, 2000);
    return () => clearInterval(interval);
  }, [loadStats]);

  // Sync listening state with service
  useEffect(() => {
    setIsListening(voiceService.isRecording());
  }, [voiceService]);

  return {
    isListening,
    isProcessing,
    transcription,
    error,
    recordings,
    stats,
    wakeWordEnabled,
    startListening: handleStartListening,
    stopListening: handleStopListening,
    toggleWakeWord: handleToggleWakeWord,
    playRecording: handlePlayRecording,
    deleteRecording: handleDeleteRecording,
    transcribeRecording: handleTranscribeRecording,
    quickTranscribe: handleQuickTranscribe,
    clearAll: clearAllRecordings,
  };
};