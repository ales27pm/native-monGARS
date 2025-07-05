import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useVoice from '../hooks/useVoice';
import type { VoiceRecording } from '../services/VoiceService';
import { cn } from '../utils/cn';

interface RecordingItemProps {
  recording: VoiceRecording;
  onPlay: (recording: VoiceRecording) => void;
  onDelete: (id: string) => void;
  onTranscribe: (recording: VoiceRecording) => void;
  isPlaying?: boolean;
  isTranscribing?: boolean;
}

const RecordingItem = React.memo<RecordingItemProps>(({
  recording,
  onPlay,
  onDelete,
  onTranscribe,
  isPlaying = false,
  isTranscribing = false
}) => {
  const formatDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-gray-900">
            Recording #{recording.id.slice(-4)}
          </Text>
          <Text className="text-xs text-gray-500">
            {formatTimestamp(recording.timestamp)} • {formatDuration(recording.duration)}
          </Text>
        </View>
        <View className="flex-row space-x-2">
          <Pressable
            onPress={() => onPlay(recording)}
            disabled={isPlaying}
            className={cn(
              'w-8 h-8 rounded-full items-center justify-center',
              isPlaying ? 'bg-red-500' : 'bg-blue-500'
            )}
          >
            <Ionicons
              name={isPlaying ? "stop" : "play"}
              size={14}
              color="white"
            />
          </Pressable>
          <Pressable
            onPress={() => onDelete(recording.id)}
            className="w-8 h-8 rounded-full items-center justify-center bg-red-500"
          >
            <Ionicons name="trash" size={14} color="white" />
          </Pressable>
        </View>
      </View>

      {recording.transcription ? (
        <View className="bg-gray-50 rounded-xl p-3">
          <Text className="text-gray-800 text-sm leading-relaxed">
            {recording.transcription}
          </Text>
        </View>
      ) : (
        <Pressable
          onPress={() => onTranscribe(recording)}
          disabled={isTranscribing}
          className="bg-blue-50 rounded-xl p-3 flex-row items-center justify-center"
        >
          {isTranscribing ? (
            <ActivityIndicator size="small" color="#3B82F6" />
          ) : (
            <Ionicons name="document-text-outline" size={16} color="#3B82F6" />
          )}
          <Text className="text-blue-600 text-sm font-medium ml-2">
            {isTranscribing ? 'Transcribing...' : 'Tap to transcribe'}
          </Text>
        </Pressable>
      )}
    </View>
  );
});

RecordingItem.displayName = 'RecordingItem';

interface VoiceStatsProps {
  stats: {
    recordingsCount: number;
    totalDuration: number;
    wakeWordEnabled: boolean;
    initialized: boolean;
  };
}

const VoiceStats = React.memo<VoiceStatsProps>(({ stats }) => {
  const formatTotalDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m ${seconds % 60}s`;
  };

  return (
    <View className="bg-blue-50 rounded-2xl p-4 mb-6">
      <Text className="text-blue-900 font-bold text-lg mb-3">Voice Statistics</Text>
      <View className="space-y-2">
        <View className="flex-row justify-between">
          <Text className="text-blue-800">Recordings</Text>
          <Text className="text-blue-900 font-semibold">{stats.recordingsCount}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-blue-800">Total Duration</Text>
          <Text className="text-blue-900 font-semibold">
            {formatTotalDuration(stats.totalDuration)}
          </Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-blue-800">Wake Word</Text>
          <Text className="text-blue-900 font-semibold">
            {stats.wakeWordEnabled ? 'Enabled' : 'Disabled'}
          </Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-blue-800">Status</Text>
          <Text className="text-blue-900 font-semibold">
            {stats.initialized ? 'Ready' : 'Initializing...'}
          </Text>
        </View>
      </View>
    </View>
  );
});

VoiceStats.displayName = 'VoiceStats';

export default function VoiceScreen() {
  const {
    isListening,
    isLoading,
    error,
    recordings,
    stats,
    startRecording,
    stopRecording,
    clearError,
    deleteRecording,
    transcribeRecording,
    playRecording,
    setWakeWordEnabled,
  } = useVoice();

  const [playingRecordingId, setPlayingRecordingId] = useState<string | null>(null);
  const [transcribingId, setTranscribingId] = useState<string | null>(null);

  useEffect(() => {
    console.log('VoiceScreen mounted');
    return () => {
      console.log('VoiceScreen unmounted');
    };
  }, []);

  const handleRecordingToggle = async () => {
    try {
      if (isListening) {
        await stopRecording();
      } else {
        await startRecording();
      }
    } catch (error) {
      console.error('Recording toggle failed:', error);
      Alert.alert(
        'Recording Error',
        'Failed to toggle recording. Please check permissions and try again.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const handlePlayRecording = async (recording: VoiceRecording) => {
    try {
      if (playingRecordingId === recording.id) {
        // Stop current playback
        setPlayingRecordingId(null);
        // Note: In a full implementation, you'd stop the actual audio playback here
      } else {
        setPlayingRecordingId(recording.id);
        await playRecording(recording);
        // Auto-stop after playback (you'd implement this based on audio duration)
        setTimeout(() => setPlayingRecordingId(null), recording.duration);
      }
    } catch (error) {
      console.error('Playback failed:', error);
      setPlayingRecordingId(null);
      Alert.alert('Playback Error', 'Failed to play recording.');
    }
  };

  const handleDeleteRecording = async (id: string) => {
    Alert.alert(
      'Delete Recording',
      'Are you sure you want to delete this recording? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecording(id);
            } catch (error) {
              console.error('Delete failed:', error);
              Alert.alert('Error', 'Failed to delete recording.');
            }
          }
        }
      ]
    );
  };

  const handleTranscribeRecording = async (recording: VoiceRecording) => {
    if (recording.transcription || transcribingId === recording.id) return;

    try {
      setTranscribingId(recording.id);
      await transcribeRecording(recording);
    } catch (error) {
      console.error('Transcription failed:', error);
      Alert.alert('Transcription Error', 'Failed to transcribe recording.');
    } finally {
      setTranscribingId(null);
    }
  };

  const handleWakeWordToggle = () => {
    setWakeWordEnabled(!stats.wakeWordEnabled);
  };

  const handleClearAllRecordings = () => {
    if (recordings.length === 0) return;

    Alert.alert(
      'Clear All Recordings',
      `Are you sure you want to delete all ${recordings.length} recordings? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const recording of recordings) {
                await deleteRecording(recording.id);
              }
            } catch (error) {
              console.error('Clear all failed:', error);
              Alert.alert('Error', 'Failed to clear all recordings.');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <View className="items-center mb-6">
            <View className="w-20 h-20 bg-red-500 rounded-full items-center justify-center mb-4 shadow-lg">
              <Ionicons name="mic" size={40} color="white" />
            </View>
            <Text className="text-3xl font-bold text-gray-900">Voice</Text>
            <Text className="text-gray-500 text-center mt-1">
              Record, transcribe, and manage audio
            </Text>
          </View>

          {/* Error Banner */}
          {error && (
            <View className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <Ionicons name="warning" size={20} color="#DC2626" />
                  <Text className="text-red-800 text-sm ml-2 flex-1">{error}</Text>
                </View>
                <Pressable onPress={clearError} className="ml-2">
                  <Ionicons name="close" size={20} color="#DC2626" />
                </Pressable>
              </View>
            </View>
          )}

          {/* Voice Stats */}
          <VoiceStats stats={stats} />

          {/* Recording Controls */}
          <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <Text className="text-lg font-bold text-gray-900 mb-4 text-center">
              Recording Controls
            </Text>
            
            <View className="items-center mb-6">
              <Pressable
                onPress={handleRecordingToggle}
                disabled={isLoading}
                className={cn(
                  'w-24 h-24 rounded-full items-center justify-center shadow-lg',
                  isListening
                    ? 'bg-red-500 active:bg-red-600'
                    : 'bg-blue-500 active:bg-blue-600',
                  isLoading && 'opacity-70'
                )}
              >
                {isLoading ? (
                  <ActivityIndicator size="large" color="white" />
                ) : (
                  <Ionicons
                    name={isListening ? "stop" : "mic"}
                    size={40}
                    color="white"
                  />
                )}
              </Pressable>
              <Text className="text-gray-600 text-center mt-3">
                {isListening ? 'Tap to stop recording' : 'Tap to start recording'}
              </Text>
            </View>

            {/* Controls Row */}
            <View className="flex-row justify-center space-x-4">
              <Pressable
                onPress={handleWakeWordToggle}
                className={cn(
                  'flex-1 py-3 px-4 rounded-xl flex-row items-center justify-center',
                  stats.wakeWordEnabled ? 'bg-green-100' : 'bg-gray-100'
                )}
              >
                <Ionicons
                  name={stats.wakeWordEnabled ? "checkmark-circle" : "ellipse-outline"}
                  size={20}
                  color={stats.wakeWordEnabled ? "#10B981" : "#6B7280"}
                />
                <Text className={cn(
                  'text-sm font-medium ml-2',
                  stats.wakeWordEnabled ? 'text-green-800' : 'text-gray-600'
                )}>
                  Wake Word
                </Text>
              </Pressable>

              {recordings.length > 0 && (
                <Pressable
                  onPress={handleClearAllRecordings}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-100 flex-row items-center justify-center"
                >
                  <Ionicons name="trash" size={20} color="#DC2626" />
                  <Text className="text-red-800 text-sm font-medium ml-2">
                    Clear All
                  </Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Recordings List */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900">Recordings</Text>
              <Text className="text-gray-500 text-sm">{recordings.length} total</Text>
            </View>

            {recordings.length === 0 ? (
              <View className="bg-white rounded-2xl p-8 items-center">
                <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                  <Ionicons name="mic-outline" size={32} color="#9CA3AF" />
                </View>
                <Text className="text-gray-500 text-center mb-2">No recordings yet</Text>
                <Text className="text-gray-400 text-sm text-center">
                  Tap the record button to start your first recording
                </Text>
              </View>
            ) : (
              <View>
                {recordings.map((recording) => (
                  <RecordingItem
                    key={recording.id}
                    recording={recording}
                    onPlay={handlePlayRecording}
                    onDelete={handleDeleteRecording}
                    onTranscribe={handleTranscribeRecording}
                    isPlaying={playingRecordingId === recording.id}
                    isTranscribing={transcribingId === recording.id}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Features Info */}
          <View className="bg-purple-50 rounded-2xl p-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="information-circle" size={20} color="#8B5CF6" />
              <Text className="text-purple-900 font-bold ml-2">Voice Features</Text>
            </View>
            <Text className="text-purple-800 text-sm leading-relaxed">
              • High-quality audio recording{'\n'}
              • Automatic transcription with AI{'\n'}
              • Wake word detection{'\n'}
              • Privacy-focused local processing{'\n'}
              • Export and share capabilities
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}