import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CalendarService, type CalendarEvent } from '../services/CalendarService';
import { ContactsService, type ContactInfo } from '../services/ContactsService';
import { RAGService, type RAGStats } from '../services/RAGService';
import { VoiceService, type VoiceStats } from '../services/VoiceService';

export default function ToolsScreen() {
  const [loading, setLoading] = useState<string | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [contacts, setContacts] = useState<ContactInfo[]>([]);
  const [ragStats, setRagStats] = useState<RAGStats | null>(null);
  const [voiceStats, setVoiceStats] = useState<VoiceStats | null>(null);
  const [showAddDocumentModal, setShowAddDocumentModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const calendarService = CalendarService.getInstance();
  const contactsService = ContactsService.getInstance();
  const ragService = RAGService.getInstance();
  const voiceService = VoiceService.getInstance();

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const [ragStatsData, voiceStatsData] = await Promise.all([
        ragService.getStats(),
        Promise.resolve(voiceService.getStats()),
      ]);
      setRagStats(ragStatsData);
      setVoiceStats(voiceStatsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCalendarAccess = async () => {
    setLoading('calendar');
    try {
      const hasPermission = await calendarService.requestPermissions();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Calendar access is required to manage events.');
        return;
      }

      const events = await calendarService.getUpcomingEvents(7);
      setCalendarEvents(events);
      
      Alert.alert(
        'Calendar Access',
        `Found ${events.length} upcoming events in the next 7 days.`,
        [
          { text: 'OK' },
          { text: 'View Events', onPress: () => showCalendarEvents(events) }
        ]
      );
    } catch (error) {
      console.error('Calendar error:', error);
      Alert.alert('Error', 'Failed to access calendar. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleContactsAccess = async () => {
    setLoading('contacts');
    try {
      const hasPermission = await contactsService.requestPermissions();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Contacts access is required to manage your address book.');
        return;
      }

      const allContacts = await contactsService.getAllContacts();
      setContacts(allContacts);
      
      Alert.alert(
        'Contacts Access',
        `Found ${allContacts.length} contacts in your address book.`,
        [
          { text: 'OK' },
          { text: 'Search', onPress: () => setShowSearchModal(true) }
        ]
      );
    } catch (error) {
      console.error('Contacts error:', error);
      Alert.alert('Error', 'Failed to access contacts. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleRAGDemo = async () => {
    setLoading('rag');
    try {
      await ragService.initialize();
      const stats = await ragService.getStats();
      
      if (stats.documentCount === 0) {
        Alert.alert(
          'RAG System',
          'No documents found. Would you like to add a sample document?',
          [
            { text: 'Cancel' },
            { text: 'Add Sample', onPress: addSampleDocument }
          ]
        );
      } else {
        Alert.alert(
          'RAG System Status',
          `Documents: ${stats.documentCount}\nTotal tokens: ${stats.totalTokens}\nLast indexed: ${stats.lastIndexed?.toLocaleString() || 'Never'}`,
          [
            { text: 'OK' },
            { text: 'Search', onPress: () => setShowSearchModal(true) }
          ]
        );
      }
    } catch (error) {
      console.error('RAG error:', error);
      Alert.alert('Error', 'Failed to access RAG system. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const addSampleDocument = async () => {
    try {
      await ragService.addDocument(
        'monGARS Overview',
        'monGARS is a privacy-first AI assistant that runs locally on your device. It provides chat capabilities with multiple AI providers including Anthropic Claude, OpenAI GPT, and Grok AI. The system includes voice recognition, calendar integration, contacts management, and a RAG system for document search and retrieval.',
        {
          source: 'system',
          type: 'text',
          tags: ['overview', 'features', 'AI'],
        }
      );
      
      await ragService.addDocument(
        'Privacy Features',
        'All data processing in monGARS happens locally on your device. No conversations or personal data are sent to external servers without your explicit consent. The RAG system stores documents locally using AsyncStorage, and all API calls are made directly from your device.',
        {
          source: 'system',
          type: 'text',
          tags: ['privacy', 'security', 'local'],
        }
      );

      Alert.alert('Success', 'Sample documents added to RAG system!');
      loadStats();
    } catch (error) {
      console.error('Error adding sample documents:', error);
      Alert.alert('Error', 'Failed to add sample documents.');
    }
  };

  const handleVoiceProcessing = async () => {
    setLoading('voice');
    try {
      const initialized = await voiceService.initialize();
      if (!initialized) {
        Alert.alert('Permission Required', 'Microphone access is required for voice processing.');
        return;
      }

      const stats = voiceService.getStats();
      Alert.alert(
        'Voice Processing',
        `Status: ${stats.initialized ? 'Ready' : 'Not Ready'}\nRecordings: ${stats.recordingsCount}\nWake word: ${stats.wakeWordEnabled ? 'Enabled' : 'Disabled'}`,
        [
          { text: 'OK' },
          { text: 'Test Recording', onPress: testVoiceRecording }
        ]
      );
    } catch (error) {
      console.error('Voice error:', error);
      Alert.alert('Error', 'Failed to initialize voice processing. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const testVoiceRecording = async () => {
    try {
      setLoading('voice');
      Alert.alert(
        'Voice Recording',
        'Recording will start for 3 seconds. Please speak clearly.',
        [
          { text: 'Cancel' },
          { text: 'Start', onPress: startRecording }
        ]
      );
    } catch (error) {
      console.error('Voice recording error:', error);
      Alert.alert('Error', 'Failed to start voice recording.');
    } finally {
      setLoading(null);
    }
  };

  const startRecording = async () => {
    try {
      const started = await voiceService.startRecording();
      if (!started) {
        Alert.alert('Error', 'Failed to start recording.');
        return;
      }

      setTimeout(async () => {
        const recording = await voiceService.stopRecording();
        if (recording) {
          Alert.alert(
            'Recording Complete',
            `Recorded ${Math.round(recording.duration / 1000)}s of audio.`,
            [
              { text: 'OK' },
              { text: 'Transcribe', onPress: () => transcribeRecording(recording) }
            ]
          );
        }
      }, 3000);
    } catch (error) {
      console.error('Recording error:', error);
      Alert.alert('Error', 'Failed to record audio.');
    }
  };

  const transcribeRecording = async (recording: any) => {
    try {
      setLoading('transcription');
      const transcription = await voiceService.transcribeRecording(recording);
      Alert.alert('Transcription', `"${transcription}"`);
    } catch (error) {
      console.error('Transcription error:', error);
      Alert.alert('Error', 'Failed to transcribe recording.');
    } finally {
      setLoading(null);
    }
  };

  const showCalendarEvents = (events: CalendarEvent[]) => {
    const eventList = events.map(event => 
      `• ${event.title} - ${event.startDate.toLocaleDateString()}`
    ).join('\n');
    
    Alert.alert('Upcoming Events', eventList || 'No upcoming events');
  };

  const searchDocuments = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading('search');
    try {
      const results = await ragService.searchDocuments(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search documents.');
    } finally {
      setLoading(null);
    }
  };

  const ToolCard = ({ title, description, icon, onPress, color, isLoading }: any) => (
    <Pressable
      onPress={onPress}
      disabled={isLoading}
      className={`bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 ${
        isLoading ? 'opacity-50' : 'active:bg-gray-50'
      }`}
    >
      <View className="flex-row items-center">
        <View className={`w-12 h-12 rounded-2xl ${color} items-center justify-center mr-4`}>
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Ionicons name={icon} size={24} color="white" />
          )}
        </View>
        <View className="flex-1">
          <Text className="text-gray-900 font-bold text-lg">{title}</Text>
          <Text className="text-gray-600 text-sm mt-1">{description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>
    </Pressable>
  );

  const StatCard = ({ title, value, subtitle, color }: any) => (
    <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-gray-900 font-bold text-lg">{title}</Text>
        <View className={`w-3 h-3 rounded-full ${color}`} />
      </View>
      <Text className="text-2xl font-bold text-gray-900">{value}</Text>
      <Text className="text-gray-500 text-sm">{subtitle}</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="px-6 pt-4">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-900">Tools & Services</Text>
            <Text className="text-gray-600 mt-1">Access device capabilities and AI features</Text>
          </View>

          {/* Native Device Access */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">Native Device Access</Text>
            
            <ToolCard
              title="Calendar"
              description="Manage events, view schedule, create appointments"
              icon="calendar-outline"
              color="bg-blue-500"
              onPress={handleCalendarAccess}
              isLoading={loading === 'calendar'}
            />
            
            <ToolCard
              title="Contacts"
              description="Search contacts, manage address book"
              icon="people-outline"
              color="bg-green-500"
              onPress={handleContactsAccess}
              isLoading={loading === 'contacts'}
            />
          </View>

          {/* AI-Powered Services */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">AI-Powered Services</Text>
            
            <ToolCard
              title="RAG System"
              description="Index documents and perform semantic search"
              icon="search-outline"
              color="bg-purple-500"
              onPress={handleRAGDemo}
              isLoading={loading === 'rag'}
            />
            
            <ToolCard
              title="Voice Processing"
              description="Speech recognition and wake word detection"
              icon="mic-outline"
              color="bg-red-500"
              onPress={handleVoiceProcessing}
              isLoading={loading === 'voice'}
            />
          </View>

          {/* System Status */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">System Status</Text>
            
            <View className="grid grid-cols-2 gap-4">
              <StatCard
                title="Documents"
                value={ragStats?.documentCount || 0}
                subtitle="RAG indexed"
                color="bg-purple-500"
              />
              
              <StatCard
                title="Recordings"
                value={voiceStats?.recordingsCount || 0}
                subtitle="Voice processed"
                color="bg-red-500"
              />
            </View>
          </View>

          {/* System Info */}
          <View className="bg-blue-50 rounded-2xl p-4 mb-6">
            <View className="flex-row items-center mb-2">
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <Text className="text-blue-900 font-bold ml-2">System Information</Text>
            </View>
            <Text className="text-blue-800 text-sm leading-relaxed">
              All services run locally on your device for maximum privacy. 
              Permissions are requested only when needed for specific features.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Search Modal */}
      <Modal visible={showSearchModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-white">
          <View className="px-6 pt-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900">Search</Text>
              <Pressable onPress={() => setShowSearchModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>
            
            <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3 mb-4">
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search documents..."
                className="flex-1 text-gray-900"
                onSubmitEditing={searchDocuments}
              />
              <Pressable onPress={searchDocuments} disabled={loading === 'search'}>
                {loading === 'search' ? (
                  <ActivityIndicator color="#6B7280" />
                ) : (
                  <Ionicons name="search" size={20} color="#6B7280" />
                )}
              </Pressable>
            </View>
            
            <ScrollView>
              {searchResults.map((result, index) => (
                <View key={index} className="bg-gray-50 rounded-2xl p-4 mb-3">
                  <Text className="font-bold text-gray-900">{result.document.title}</Text>
                  <Text className="text-gray-600 text-sm mt-1">
                    Score: {(result.score * 100).toFixed(1)}%
                  </Text>
                  <Text className="text-gray-700 mt-2" numberOfLines={3}>
                    {result.document.content}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}