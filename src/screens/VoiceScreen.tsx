import React from 'react';
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
import { useVoice } from '../hooks/useVoice';
import { VoiceRecording } from '../services/VoiceService';

export default function VoiceScreen() {
  const {
    isListening,
    isProcessing,
    transcription,
    error,
    recordings,
    stats,
    wakeWordEnabled,
    startListening,
    stopListening,
    toggleWakeWord,
    playRecording,
    deleteRecording,
    transcribeRecording,
    quickTranscribe,
  } = useVoice();

  React.useEffect(() => {
    if (error) {
      Alert.alert('Voice Error', error);
    }
  }, [error]);

  const StatusCard = ({ title, status, icon, color }: any) => (
    <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className={`w-10 h-10 rounded-full ${color} items-center justify-center`}>
            <Ionicons name={icon} size={20} color="white" />
          </View>
          <View className="ml-3">
            <Text className="text-gray-900 font-semibold">{title}</Text>
            <Text className="text-gray-500 text-sm">{status}</Text>
          </View>
        </View>
        <View className={`w-3 h-3 rounded-full ${
          status === 'Ready' || status === 'Enabled' || status === 'Listening' ? 'bg-green-500' : 'bg-gray-400'
        }`} />
      </View>
    </View>
  );

  const RecordingCard = ({ recording }: { recording: VoiceRecording }) => (
    <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-gray-900 font-semibold">
          {new Date(recording.timestamp).toLocaleTimeString()}
        </Text>
        <Text className="text-gray-500 text-sm">
          {Math.round(recording.duration / 1000)}s
        </Text>
      </View>
      
      {recording.transcription && (
        <Text className="text-gray-700 text-sm mb-3" numberOfLines={2}>
          "{recording.transcription}"
        </Text>
      )}
      
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={() => playRecording(recording)}
          className="flex-row items-center bg-blue-100 px-3 py-2 rounded-lg active:bg-blue-200"
        >
          <Ionicons name="play" size={16} color="#3B82F6" />
          <Text className="text-blue-600 ml-1 font-medium">Play</Text>
        </Pressable>
        
        {!recording.transcription && (
          <Pressable
            onPress={() => transcribeRecording(recording)}
            className="flex-row items-center bg-green-100 px-3 py-2 rounded-lg active:bg-green-200"
            disabled={isProcessing}
          >
            <Ionicons name="document-text" size={16} color="#10B981" />
            <Text className="text-green-600 ml-1 font-medium">Transcribe</Text>
          </Pressable>
        )}
        
        <Pressable
          onPress={() => {
            Alert.alert(
              'Delete Recording',
              'Are you sure you want to delete this recording?',
              [
                { text: 'Cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => deleteRecording(recording.id),
                },
              ]
            );
          }}
          className="flex-row items-center bg-red-100 px-3 py-2 rounded-lg active:bg-red-200"
        >
          <Ionicons name="trash" size={16} color="#EF4444" />
          <Text className="text-red-600 ml-1 font-medium">Delete</Text>
        </Pressable>
      </View>
    </View>
  );

  if (!stats?.initialized) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-600 mt-4">Initializing voice service...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="px-6 pt-4">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-900">Voice Assistant</Text>
            <Text className="text-gray-600 mt-1">
              {isListening ? 'Listening...' : 'Voice recognition and transcription'}
            </Text>
          </View>

          {/* Voice Controls */}
          <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <View className="items-center">
              <Pressable
                onPress={isListening ? stopListening : startListening}
                disabled={isProcessing}
                className={`w-24 h-24 rounded-full items-center justify-center mb-4 ${
                  isListening ? 'bg-red-500' : 'bg-blue-500'
                } ${isProcessing ? 'opacity-50' : ''}`}
              >
                {isProcessing ? (
                  <ActivityIndicator color="white" size="large" />
                ) : (
                  <Ionicons
                    name={isListening ? 'stop' : 'mic'}
                    size={40}
                    color="white"
                  />
                )}
              </Pressable>
              
              <Text className="text-lg font-bold text-gray-900 mb-2">
                {isListening ? 'Tap to Stop' : 'Tap to Start'}
              </Text>
              
              <Text className="text-gray-600 text-center mb-4">
                {isListening 
                  ? 'Recording your voice...' 
                  : 'Press to start recording your voice for transcription'
                }
              </Text>

              <Pressable
                onPress={() => {
                  Alert.alert(
                    'Quick Transcribe',
                    'This will record for 5 seconds and then transcribe. Ready?',
                    [
                      { text: 'Cancel' },
                      {
                        text: 'Start',
                        onPress: quickTranscribe,
                      },
                    ]
                  );
                }}
                disabled={isProcessing || isListening}
                className={`bg-green-500 px-6 py-3 rounded-xl ${
                  isProcessing || isListening ? 'opacity-50' : ''
                }`}
              >
                <Text className="text-white font-semibold">Quick Transcribe (5s)</Text>
              </Pressable>
            </View>
          </View>

          {/* System Status */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">System Status</Text>
            
            <StatusCard
              title="Voice Recognition"
              status={stats.initialized ? 'Ready' : 'Not Initialized'}
              icon="mic-outline"
              color="bg-blue-500"
            />
            
            <StatusCard
              title="Recording Status"
              status={isListening ? 'Listening' : 'Idle'}
              icon={isListening ? 'radio-button-on' : 'radio-button-off'}
              color={isListening ? 'bg-red-500' : 'bg-gray-500'}
            />
            
            <StatusCard
              title="Wake Word Detection"
              status={wakeWordEnabled ? 'Enabled' : 'Disabled'}
              icon="notifications-outline"
              color={wakeWordEnabled ? 'bg-green-500' : 'bg-gray-500'}
            />
          </View>

          {/* Settings */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">Settings</Text>
            
            <Pressable
              onPress={toggleWakeWord}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-purple-500 items-center justify-center">
                    <Ionicons name="notifications-outline" size={20} color="white" />
                  </View>
                  <View className="ml-3">
                    <Text className="text-gray-900 font-semibold">Wake Word Detection</Text>
                    <Text className="text-gray-500 text-sm">
                      {wakeWordEnabled ? 'Enabled' : 'Disabled'}
                    </Text>
                  </View>
                </View>
                <View className={`w-12 h-6 rounded-full ${
                  wakeWordEnabled ? 'bg-green-500' : 'bg-gray-300'
                } relative`}>
                  <View className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${
                    wakeWordEnabled ? 'right-0.5' : 'left-0.5'
                  }`} />
                </View>
              </View>
            </Pressable>
          </View>

          {/* Recent Transcription */}
          {transcription && (
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-900 mb-4">Latest Transcription</Text>
              <View className="bg-blue-50 rounded-2xl p-4">
                <Text className="text-blue-900 font-medium">
                  "{transcription}"
                </Text>
              </View>
            </View>
          )}

          {/* Recent Recordings */}
          {recordings.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-900 mb-4">
                Recent Recordings ({recordings.length})
              </Text>
              {recordings.map(recording => (
                <RecordingCard key={recording.id} recording={recording} />
              ))}
            </View>
          )}

          {/* Statistics */}
          {stats && (
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-900 mb-4">Statistics</Text>
              <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-gray-600">Total Recordings</Text>
                  <Text className="text-gray-900 font-semibold">{stats.recordingsCount}</Text>
                </View>
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-gray-600">Total Duration</Text>
                  <Text className="text-gray-900 font-semibold">
                    {Math.round(stats.totalDuration / 1000)}s
                  </Text>
                </View>
                {stats.lastRecording && (
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-600">Last Recording</Text>
                    <Text className="text-gray-900 font-semibold">
                      {stats.lastRecording.toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Privacy Notice */}
          <View className="bg-green-50 rounded-2xl p-4 mb-6">
            <View className="flex-row items-center mb-2">
              <Ionicons name="shield-checkmark" size={20} color="#10B981" />
              <Text className="text-green-900 font-bold ml-2">Privacy Protected</Text>
            </View>
            <Text className="text-green-800 text-sm leading-relaxed">
              All voice processing happens locally on your device. Audio recordings 
              are stored securely and transcription uses encrypted API calls.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}