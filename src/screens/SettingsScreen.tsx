import React, { useState } from 'react';
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
import useAppStore from '../state/appStore';
import type { AIProvider, AppSettings } from '../state/appStore';
import { cn } from '../utils/cn';

interface SettingItemProps {
  title: string;
  description?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
}

const SettingItem = React.memo<SettingItemProps>(({ 
  title, 
  description, 
  icon, 
  onPress, 
  rightElement, 
  showChevron = false 
}) => (
  <Pressable
    onPress={onPress}
    disabled={!onPress}
    className={cn(
      'bg-white rounded-2xl p-4 mb-3 border border-gray-100',
      onPress ? 'active:bg-gray-50' : ''
    )}
  >
    <View className="flex-row items-center">
      <View className="w-10 h-10 bg-gray-200 rounded-full items-center justify-center mr-3">
        <Ionicons name={icon} size={20} color="#6B7280" />
      </View>
      <View className="flex-1">
        <Text className="text-gray-900 font-semibold">{title}</Text>
        {description && (
          <Text className="text-gray-500 text-sm mt-1">{description}</Text>
        )}
      </View>
      {rightElement}
      {showChevron && onPress && (
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      )}
    </View>
  </Pressable>
));

SettingItem.displayName = 'SettingItem';

interface ProviderSelectorProps {
  selectedProvider: AIProvider;
  onProviderChange: (provider: AIProvider) => void;
  serviceStatus: any;
}

const ProviderSelector = React.memo<ProviderSelectorProps>(({ 
  selectedProvider, 
  onProviderChange, 
  serviceStatus 
}) => {
  const providers: Array<{ key: AIProvider; name: string; icon: string }> = [
    { key: 'local', name: 'Local LLM', icon: '🧠' },
    { key: 'anthropic', name: 'Claude', icon: '🤖' },
    { key: 'openai', name: 'GPT', icon: '⚡' },
    { key: 'grok', name: 'Grok', icon: '🚀' },
  ];

  return (
    <View className="space-y-2">
      {providers.map((provider) => {
        const isAvailable = provider.key === 'local' ? true : serviceStatus[provider.key]?.available;
        const isSelected = selectedProvider === provider.key;
        
        return (
          <Pressable
            key={provider.key}
            onPress={() => isAvailable && onProviderChange(provider.key)}
            disabled={!isAvailable}
            className={cn(
              'p-3 rounded-xl flex-row items-center justify-between',
              isSelected 
                ? 'bg-blue-50 border border-blue-200'
                : isAvailable
                ? 'bg-gray-50'
                : 'bg-gray-100 opacity-50'
            )}
          >
            <View className="flex-row items-center">
              <Text className="text-lg mr-3">{provider.icon}</Text>
              <View>
                <Text className={cn(
                  'font-medium',
                  isSelected ? 'text-blue-900' : 'text-gray-900'
                )}>
                  {provider.name}
                </Text>
                <Text className={cn(
                  'text-sm',
                  isSelected ? 'text-blue-600' : 'text-gray-500'
                )}>
                  {isAvailable ? 'Available' : 'Not configured'}
                </Text>
              </View>
            </View>
            {isSelected && (
              <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
            )}
          </Pressable>
        );
      })}
    </View>
  );
});

ProviderSelector.displayName = 'ProviderSelector';

interface SliderSettingProps {
  title: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onValueChange: (value: number) => void;
  formatValue?: (value: number) => string;
}

const SliderSetting = React.memo<SliderSettingProps>(({ 
  title, 
  description, 
  value, 
  min, 
  max, 
  step, 
  onValueChange,
  formatValue = (v) => v.toString()
}) => {
  const handleDecrease = () => {
    const newValue = Math.max(min, value - step);
    onValueChange(newValue);
  };

  const handleIncrease = () => {
    const newValue = Math.min(max, value + step);
    onValueChange(newValue);
  };

  return (
    <View className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
      <View className="mb-3">
        <Text className="text-gray-900 font-semibold">{title}</Text>
        <Text className="text-gray-500 text-sm mt-1">{description}</Text>
      </View>
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={handleDecrease}
          disabled={value <= min}
          className={cn(
            'w-10 h-10 rounded-full items-center justify-center',
            value <= min ? 'bg-gray-200' : 'bg-blue-500'
          )}
        >
          <Ionicons 
            name="remove" 
            size={20} 
            color={value <= min ? '#9CA3AF' : 'white'} 
          />
        </Pressable>
        
        <View className="flex-1 mx-4">
          <View className="bg-gray-200 h-2 rounded-full">
            <View 
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: `${((value - min) / (max - min)) * 100}%` }}
            />
          </View>
          <Text className="text-center text-blue-600 font-semibold mt-2">
            {formatValue(value)}
          </Text>
        </View>
        
        <Pressable
          onPress={handleIncrease}
          disabled={value >= max}
          className={cn(
            'w-10 h-10 rounded-full items-center justify-center',
            value >= max ? 'bg-gray-200' : 'bg-blue-500'
          )}
        >
          <Ionicons 
            name="add" 
            size={20} 
            color={value >= max ? '#9CA3AF' : 'white'} 
          />
        </Pressable>
      </View>
    </View>
  );
});

SliderSetting.displayName = 'SliderSetting';

export default function SettingsScreen() {
  const { 
    settings, 
    serviceStatus, 
    updateSettings, 
    resetSettings,
    getAvailableServices,
    getServiceCount 
  } = useAppStore();

  const [showProviderSelector, setShowProviderSelector] = useState(false);

  const handleProviderChange = (provider: AIProvider) => {
    updateSettings({ preferredAIProvider: provider });
    setShowProviderSelector(false);
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to their default values? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            resetSettings();
            Alert.alert('Settings Reset', 'All settings have been reset to their default values.');
          }
        },
      ]
    );
  };

  const handleExportSettings = () => {
    const exportData = {
      settings,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
    
    Alert.alert(
      'Export Settings',
      'Settings export:\n\n' + JSON.stringify(exportData, null, 2).slice(0, 200) + '...',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About monGARS',
      'monGARS AI Assistant\nVersion 1.0.0\n\nA privacy-first AI assistant with on-device processing capabilities.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const availableServices = getAvailableServices();
  const serviceCount = getServiceCount();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <View className="items-center mb-6">
            <View className="w-20 h-20 bg-gray-500 rounded-full items-center justify-center mb-4 shadow-lg">
              <Ionicons name="settings" size={40} color="white" />
            </View>
            <Text className="text-3xl font-bold text-gray-900">Settings</Text>
            <Text className="text-gray-500 text-center mt-1">
              Configure your AI assistant
            </Text>
          </View>

          {/* Service Status */}
          <View className="bg-white rounded-2xl p-4 mb-6 border border-gray-100">
            <Text className="text-lg font-bold text-gray-900 mb-3">Service Status</Text>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-600">Available Services</Text>
              <Text className="text-green-600 font-semibold">{serviceCount}/4</Text>
            </View>
            <View className="space-y-2">
              {Object.entries(serviceStatus).map(([service, status]) => (
                <View key={service} className="flex-row items-center justify-between">
                  <Text className="text-gray-700 capitalize">{service}</Text>
                  <View className="flex-row items-center">
                    <View className={cn(
                      'w-2 h-2 rounded-full mr-2',
                      status.available ? 'bg-green-500' : 'bg-red-500'
                    )} />
                    <Text className={cn(
                      'text-sm',
                      status.available ? 'text-green-600' : 'text-red-600'
                    )}>
                      {status.available ? 'Ready' : 'Unavailable'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* AI Provider */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">AI Provider</Text>
            
            <SettingItem
              title="Preferred AI Provider"
              description={`Currently using ${settings.preferredAIProvider}`}
              icon="brain"
              onPress={() => setShowProviderSelector(!showProviderSelector)}
              showChevron
            />

            {showProviderSelector && (
              <View className="mt-3">
                <ProviderSelector
                  selectedProvider={settings.preferredAIProvider}
                  onProviderChange={handleProviderChange}
                  serviceStatus={serviceStatus}
                />
              </View>
            )}
          </View>

          {/* AI Parameters */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">AI Parameters</Text>
            
            <SliderSetting
              title="Temperature"
              description="Controls randomness in AI responses"
              value={settings.temperature}
              min={0}
              max={1}
              step={0.1}
              onValueChange={(value) => updateSettings({ temperature: value })}
              formatValue={(v) => v.toFixed(1)}
            />

            <SliderSetting
              title="Max Tokens"
              description="Maximum length of AI responses"
              value={settings.maxTokens}
              min={100}
              max={4000}
              step={100}
              onValueChange={(value) => updateSettings({ maxTokens: value })}
            />
          </View>

          {/* Voice Settings */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">Voice & Audio</Text>
            
            <SettingItem
              title="Voice Enabled"
              description="Enable voice input and output"
              icon="mic"
              rightElement={
                <Switch
                  value={settings.voiceEnabled}
                  onValueChange={(value) => updateSettings({ voiceEnabled: value })}
                  trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                  thumbColor={settings.voiceEnabled ? '#FFFFFF' : '#9CA3AF'}
                />
              }
            />

            <SettingItem
              title="Wake Word Detection"
              description="Activate with voice commands"
              icon="mic-circle"
              rightElement={
                <Switch
                  value={settings.wakeWordEnabled}
                  onValueChange={(value) => updateSettings({ wakeWordEnabled: value })}
                  trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                  thumbColor={settings.wakeWordEnabled ? '#FFFFFF' : '#9CA3AF'}
                />
              }
            />

            <SettingItem
              title="Voice Language"
              description={`Currently set to ${settings.voiceLanguage}`}
              icon="language"
              onPress={() => Alert.alert('Coming Soon', 'Language selection will be available in a future update.')}
              showChevron
            />
          </View>

          {/* Privacy Settings */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">Privacy & Security</Text>
            
            <SettingItem
              title="Privacy Mode"
              description="Enhanced privacy protection"
              icon="shield-checkmark"
              rightElement={
                <Switch
                  value={settings.privacyMode}
                  onValueChange={(value) => updateSettings({ privacyMode: value })}
                  trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                  thumbColor={settings.privacyMode ? '#FFFFFF' : '#9CA3AF'}
                />
              }
            />

            <SettingItem
              title="Auto-save Conversations"
              description="Automatically save chat history"
              icon="save"
              rightElement={
                <Switch
                  value={settings.autoSaveConversations}
                  onValueChange={(value) => updateSettings({ autoSaveConversations: value })}
                  trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                  thumbColor={settings.autoSaveConversations ? '#FFFFFF' : '#9CA3AF'}
                />
              }
            />
          </View>

          {/* App Settings */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">App Settings</Text>
            
            <SettingItem
              title="Notifications"
              description="Enable app notifications"
              icon="notifications"
              rightElement={
                <Switch
                  value={settings.notificationsEnabled}
                  onValueChange={(value) => updateSettings({ notificationsEnabled: value })}
                  trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                  thumbColor={settings.notificationsEnabled ? '#FFFFFF' : '#9CA3AF'}
                />
              }
            />

            <SettingItem
              title="Haptic Feedback"
              description="Vibration feedback for interactions"
              icon="phone-portrait"
              rightElement={
                <Switch
                  value={settings.hapticFeedback}
                  onValueChange={(value) => updateSettings({ hapticFeedback: value })}
                  trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                  thumbColor={settings.hapticFeedback ? '#FFFFFF' : '#9CA3AF'}
                />
              }
            />

            <SettingItem
              title="Theme"
              description={`Currently using ${settings.theme} theme`}
              icon="color-palette"
              onPress={() => Alert.alert('Coming Soon', 'Theme selection will be available in a future update.')}
              showChevron
            />
          </View>

          {/* Advanced */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">Advanced</Text>
            
            <SettingItem
              title="Export Settings"
              description="Save current configuration"
              icon="download"
              onPress={handleExportSettings}
              showChevron
            />

            <SettingItem
              title="Reset Settings"
              description="Restore default configuration"
              icon="refresh"
              onPress={handleResetSettings}
              showChevron
            />

            <SettingItem
              title="About"
              description="App information and version"
              icon="information-circle"
              onPress={handleAbout}
              showChevron
            />
          </View>

          {/* Privacy Notice */}
          <View className="bg-green-50 rounded-2xl p-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="shield-checkmark" size={20} color="#10B981" />
              <Text className="text-green-900 font-bold ml-2">Privacy First</Text>
            </View>
            <Text className="text-green-800 text-sm leading-relaxed">
              Your privacy is our priority. All conversations and data processing 
              happen locally on your device when using the Local LLM. Cloud providers 
              are used only when explicitly selected and follow strict privacy policies.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}