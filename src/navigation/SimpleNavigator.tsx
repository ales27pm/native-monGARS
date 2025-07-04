import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();

function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 items-center justify-center p-4">
        <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 w-full max-w-sm">
          <View className="items-center mb-4">
            <View className="w-16 h-16 bg-blue-500 rounded-full items-center justify-center mb-3">
              <Ionicons name="brain-outline" size={32} color="white" />
            </View>
            <Text className="text-2xl font-bold text-gray-900">monGARS</Text>
            <Text className="text-gray-500 text-center">Privacy-First AI Assistant</Text>
          </View>
          
          <View className="space-y-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Agent Service</Text>
              <View className="flex-row items-center">
                <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                <Text className="text-green-600 font-medium">Ready</Text>
              </View>
            </View>
            
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Voice Pipeline</Text>
              <View className="flex-row items-center">
                <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                <Text className="text-green-600 font-medium">Ready</Text>
              </View>
            </View>
            
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">RAG System</Text>
              <View className="flex-row items-center">
                <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                <Text className="text-green-600 font-medium">5 Documents</Text>
              </View>
            </View>
          </View>
          
          <View className="mt-4 p-3 bg-blue-50 rounded-xl">
            <Text className="text-blue-800 text-sm text-center">
              All processing happens on your device for maximum privacy
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function ChatScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 items-center justify-center p-4">
        <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 w-full max-w-sm">
          <View className="items-center mb-4">
            <View className="w-16 h-16 bg-green-500 rounded-full items-center justify-center mb-3">
              <Ionicons name="chatbubbles-outline" size={32} color="white" />
            </View>
            <Text className="text-xl font-bold text-gray-900">Chat Interface</Text>
            <Text className="text-gray-500 text-center">Coming Soon</Text>
          </View>
          <Text className="text-gray-600 text-center">
            Full chat interface with AI conversation capabilities will be available here.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function VoiceScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 items-center justify-center p-4">
        <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 w-full max-w-sm">
          <View className="items-center mb-4">
            <View className="w-16 h-16 bg-red-500 rounded-full items-center justify-center mb-3">
              <Ionicons name="mic-outline" size={32} color="white" />
            </View>
            <Text className="text-xl font-bold text-gray-900">Voice Assistant</Text>
            <Text className="text-gray-500 text-center">Coming Soon</Text>
          </View>
          <Text className="text-gray-600 text-center">
            Voice recognition and wake word detection features will be available here.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function ToolsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 items-center justify-center p-4">
        <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 w-full max-w-sm">
          <View className="items-center mb-4">
            <View className="w-16 h-16 bg-purple-500 rounded-full items-center justify-center mb-3">
              <Ionicons name="construct-outline" size={32} color="white" />
            </View>
            <Text className="text-xl font-bold text-gray-900">Tools & Services</Text>
            <Text className="text-gray-500 text-center">Coming Soon</Text>
          </View>
          <Text className="text-gray-600 text-center">
            Native device tools and AI features will be available here.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function SettingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 items-center justify-center p-4">
        <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 w-full max-w-sm">
          <View className="items-center mb-4">
            <View className="w-16 h-16 bg-gray-500 rounded-full items-center justify-center mb-3">
              <Ionicons name="settings-outline" size={32} color="white" />
            </View>
            <Text className="text-xl font-bold text-gray-900">Settings</Text>
            <Text className="text-gray-500 text-center">Coming Soon</Text>
          </View>
          <Text className="text-gray-600 text-center">
            Configuration and system settings will be available here.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

export function SimpleNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Voice') {
            iconName = focused ? 'mic' : 'mic-outline';
          } else if (route.name === 'Tools') {
            iconName = focused ? 'construct' : 'construct-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'ellipse-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Voice" component={VoiceScreen} />
      <Tab.Screen name="Tools" component={ToolsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default SimpleNavigator;