import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useSettings from '../hooks/useSettings';

export default function SettingsScreen() {
  const {
    privacyMode,
    autoSaveConversations,
    notificationsEnabled,
    darkMode,
    setSetting,
    resetSettings,
  } = useSettings();

  const SettingCard = ({ title, description, icon, color, children }: any) => (
    <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3">
      <View className="flex-row items-center">
        <View className={`w-10 h-10 rounded-full ${color} items-center justify-center`}>
          <Ionicons name={icon} size={20} color="white" />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-gray-900 font-semibold">{title}</Text>
          <Text className="text-gray-500 text-sm">{description}</Text>
        </View>
        {children}
      </View>
    </View>
  );

  const ActionCard = ({ title, description, icon, color, onPress }: any) => (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3 active:bg-gray-50"
    >
      <View className="flex-row items-center">
        <View className={`w-10 h-10 rounded-full ${color} items-center justify-center`}>
          <Ionicons name={icon} size={20} color="white" />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-gray-900 font-semibold">{title}</Text>
          <Text className="text-gray-500 text-sm">{description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>
    </Pressable>
  );

  const handleClearData = () => {
    Alert.alert(
      'Clear Data',
      'Are you sure you want to clear all app data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => {
          resetSettings();
          Alert.alert('Success', 'App data cleared successfully.');
        }},
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert('Export Data', 'Data export functionality will be available soon.');
  };

  const handleAbout = () => {
    Alert.alert(
      'About monGARS',
      'monGARS v1.0.0\nPrivacy-First AI Assistant\n\nBuilt with React Native and Expo\nDesigned for iOS\n\nAll processing happens on-device for maximum privacy and security.',
      [{ text: 'OK' }]
    );
  };

  const handleSupport = () => {
    Alert.alert('Support', 'For support and feedback, please visit our GitHub repository.');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4">
        {/* Header */}
        <View className="pt-6 pb-4">
          <Text className="text-3xl font-bold text-gray-900">Settings</Text>
          <Text className="text-gray-500 mt-1">Configure your AI assistant</Text>
        </View>

        {/* Privacy & Security */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Privacy & Security</Text>
          
          <SettingCard
            title="Privacy Mode"
            description="All data processing happens on-device"
            icon="shield-checkmark"
            color="bg-green-500"
          >
            <Switch
              value={privacyMode}
              onValueChange={(value) => setSetting('privacyMode', value)}
              trackColor={{ false: '#E5E7EB', true: '#10B981' }}
              thumbColor={privacyMode ? '#FFFFFF' : '#9CA3AF'}
            />
          </SettingCard>
          
          <SettingCard
            title="Analytics"
            description="Share anonymous usage data"
            icon="analytics"
            color="bg-blue-500"
          >
            <Switch
              value={autoSaveConversations}
              onValueChange={(value) => setSetting('autoSaveConversations', value)}
              trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
              thumbColor={autoSaveConversations ? '#FFFFFF' : '#9CA3AF'}
            />
          </SettingCard>
        </View>

        {/* App Preferences */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">App Preferences</Text>
          
          <SettingCard
            title="Notifications"
            description="Enable app notifications"
            icon="notifications"
            color="bg-purple-500"
          >
            <Switch
              value={notificationsEnabled}
              onValueChange={(value) => setSetting('notificationsEnabled', value)}
              trackColor={{ false: '#E5E7EB', true: '#8B5CF6' }}
              thumbColor={notificationsEnabled ? '#FFFFFF' : '#9CA3AF'}
            />
          </SettingCard>
          
          <SettingCard
            title="Dark Mode"
            description="Use dark theme"
            icon="moon"
            color="bg-gray-700"
          >
            <Switch
              value={darkMode}
              onValueChange={(value) => setSetting('theme', value ? 'dark' : 'light')}
              trackColor={{ false: '#E5E7EB', true: '#374151' }}
              thumbColor={darkMode ? '#FFFFFF' : '#9CA3AF'}
            />
          </SettingCard>
        </View>

        {/* Data Management */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">Data Management</Text>
          
          <ActionCard
            title="Export Data"
            description="Download your data"
            icon="download"
            color="bg-blue-500"
            onPress={handleExportData}
          />
          
          <ActionCard
            title="Clear Data"
            description="Remove all app data"
            icon="trash"
            color="bg-red-500"
            onPress={handleClearData}
          />
        </View>

        {/* About */}
        <View className="mb-8">
          <Text className="text-lg font-bold text-gray-900 mb-3">About</Text>
          
          <ActionCard
            title="About monGARS"
            description="Version info and details"
            icon="information-circle"
            color="bg-blue-500"
            onPress={handleAbout}
          />
          
          <ActionCard
            title="Support"
            description="Get help and contact us"
            icon="help-circle"
            color="bg-green-500"
            onPress={handleSupport}
          />
        </View>

        {/* Privacy Notice */}
        <View className="mb-8">
          <View className="bg-green-50 rounded-2xl p-4 border border-green-100">
            <View className="flex-row items-center mb-2">
              <Ionicons name="shield-checkmark" size={20} color="#10B981" />
              <Text className="text-green-900 font-bold ml-2">Privacy First</Text>
            </View>
            <Text className="text-green-800 text-sm leading-relaxed">
              monGARS is designed with privacy as the core principle. All AI processing, 
              voice recognition, and data analysis happens locally on your device. 
              Your personal information never leaves your control.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}