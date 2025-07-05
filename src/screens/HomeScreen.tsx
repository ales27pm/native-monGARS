import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import useAppStore from '../state/appStore';
import { cn } from '../utils/cn';

interface StatusCardProps {
  title: string;
  status: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  ready: boolean;
  onPress?: () => void;
}

const StatusCard = React.memo<StatusCardProps>(({ title, status, icon, color, ready, onPress }) => (
  <Pressable
    onPress={onPress}
    disabled={!onPress}
    className={cn(
      'bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3',
      onPress ? 'active:bg-gray-50' : ''
    )}
  >
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center">
        <View className={cn('w-10 h-10 rounded-full items-center justify-center', color)}>
          <Ionicons name={icon} size={20} color="white" />
        </View>
        <View className="ml-3">
          <Text className="text-gray-900 font-semibold">{title}</Text>
          <Text className="text-gray-500 text-sm">{status}</Text>
        </View>
      </View>
      <View className={cn('w-3 h-3 rounded-full', ready ? 'bg-green-500' : 'bg-gray-400')} />
    </View>
  </Pressable>
));

StatusCard.displayName = 'StatusCard';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}

const QuickActionCard = React.memo<QuickActionCardProps>(({ title, description, icon, color, onPress }) => (
  <Pressable
    onPress={onPress}
    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3 active:bg-gray-50"
  >
    <View className="flex-row items-center">
      <View className={cn('w-12 h-12 rounded-2xl items-center justify-center mr-4', color)}>
        <Ionicons name={icon} size={24} color="white" />
      </View>
      <View className="flex-1">
        <Text className="text-gray-900 font-semibold text-base">{title}</Text>
        <Text className="text-gray-500 text-sm mt-1">{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </View>
  </Pressable>
));

QuickActionCard.displayName = 'QuickActionCard';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { 
    serviceStatus, 
    getServiceCount, 
    checkAllServices
  } = useAppStore();

  useEffect(() => {
    console.log('Home screen mounted');
    
    // Set up periodic service checks
    const interval = setInterval(checkAllServices, 30000); // Check every 30 seconds

    return () => {
      clearInterval(interval);
      console.log('Home screen unmounted');
    };
  }, [checkAllServices]);

  const handleNavigateToChat = () => {
    console.log('Navigating to chat');
    // @ts-ignore - Navigation types not fully configured
    navigation.navigate('Chat');
  };

  const handleNavigateToVoice = () => {
    console.log('Navigating to voice');
    // @ts-ignore - Navigation types not fully configured
    navigation.navigate('Voice');
  };

  const handleNavigateToTools = () => {
    console.log('Navigating to tools');
    // @ts-ignore - Navigation types not fully configured
    navigation.navigate('Tools');
  };

  const handleNavigateToSettings = () => {
    console.log('Navigating to settings');
    // @ts-ignore - Navigation types not fully configured
    navigation.navigate('Settings');
  };

  const activeServicesCount = getServiceCount();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <View className="items-center mb-6">
            <View className="w-20 h-20 bg-blue-500 rounded-full items-center justify-center mb-4 shadow-lg">
              <Ionicons name="bulb-outline" size={40} color="white" />
            </View>
            <Text className="text-3xl font-bold text-gray-900">monGARS</Text>
            <Text className="text-gray-500 text-center mt-1">Privacy-First AI Assistant</Text>
          </View>

          {/* System Status */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">System Status</Text>
            
            <StatusCard
              title="Anthropic Claude"
              status={serviceStatus.anthropic.available ? "Ready" : "Not Available"}
              icon="leaf-outline"
              color="bg-orange-500"
              ready={serviceStatus.anthropic.available}
              onPress={serviceStatus.anthropic.available ? handleNavigateToChat : undefined}
            />
            
            <StatusCard
              title="OpenAI GPT"
              status={serviceStatus.openai.available ? "Ready" : "Not Available"}
              icon="bulb-outline"
              color="bg-green-500"
              ready={serviceStatus.openai.available}
              onPress={serviceStatus.openai.available ? handleNavigateToChat : undefined}
            />
            
            <StatusCard
              title="Grok AI"
              status={serviceStatus.grok.available ? "Ready" : "Not Available"}
              icon="flash-outline"
              color="bg-purple-500"
              ready={serviceStatus.grok.available}
              onPress={serviceStatus.grok.available ? handleNavigateToChat : undefined}
            />
            
            <StatusCard
              title="Voice Assistant"
              status={serviceStatus.voice.available ? "Ready" : "Not Available"}
              icon="mic-outline"
              color="bg-blue-500"
              ready={serviceStatus.voice.available}
              onPress={serviceStatus.voice.available ? handleNavigateToVoice : undefined}
            />
          </View>

          {/* System Overview */}
          <View className="bg-blue-50 rounded-2xl p-4 mb-6">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-blue-900 font-bold text-lg">Services Active</Text>
              <Text className="text-blue-600 font-bold text-2xl">{activeServicesCount}/4</Text>
            </View>
            <Text className="text-blue-800 text-sm">
              All processing happens locally and privately on your device
            </Text>
          </View>

          {/* Quick Actions */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">Quick Actions</Text>
            
            <QuickActionCard
              title="Start Chat"
              description="Have a conversation with AI"
              icon="chatbubbles-outline"
              color="bg-blue-500"
              onPress={handleNavigateToChat}
            />
            
            <QuickActionCard
              title="Voice Command"
              description="Use voice to interact"
              icon="mic-outline"
              color="bg-red-500"
              onPress={handleNavigateToVoice}
            />
            
            <QuickActionCard
              title="Smart Tools"
              description="Access device integrations"
              icon="construct-outline"
              color="bg-purple-500"
              onPress={handleNavigateToTools}
            />

            <QuickActionCard
              title="Settings"
              description="Configure preferences"
              icon="settings-outline"
              color="bg-gray-500"
              onPress={handleNavigateToSettings}
            />
          </View>

          {/* Privacy Notice */}
          <View className="bg-green-50 rounded-2xl p-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="shield-checkmark" size={20} color="#10B981" />
              <Text className="text-green-900 font-bold ml-2">Privacy Protected</Text>
            </View>
            <Text className="text-green-800 text-sm leading-relaxed">
              Your conversations and data never leave your device. All AI processing 
              respects your privacy and follows strict data protection protocols.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
