import React from "react";
import { StatusBar } from "expo-status-bar";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

const Tab = createBottomTabNavigator();

// Home Screen Component
function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View style={{
            width: 80,
            height: 80,
            backgroundColor: '#007AFF',
            borderRadius: 40,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16
          }}>
            <Ionicons name="bulb-outline" size={40} color="white" />
          </View>
          <Text style={{ 
            fontSize: 32, 
            fontWeight: 'bold', 
            color: '#007AFF',
            marginBottom: 8 
          }}>
            monGARS
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: '#666',
            textAlign: 'center'
          }}>
            Privacy-First AI Assistant{'\n'}On-device processing with Core ML
          </Text>
        </View>

        {/* System Overview */}
        <View style={{
          backgroundColor: '#e0f2fe',
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
          borderWidth: 1,
          borderColor: '#0284c7'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0369a1' }}>
              Services Active
            </Text>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#0284c7' }}>
              4/4
            </Text>
          </View>
          <Text style={{ fontSize: 14, color: '#0369a1' }}>
            All processing happens locally and privately on your device
          </Text>
        </View>

        {/* AI Services Status */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: '600', color: '#333', marginBottom: 16 }}>
            AI Services
          </Text>
          
          {[
            { name: 'Anthropic Claude', status: 'Ready for advanced reasoning', icon: 'leaf-outline', color: '#f97316' },
            { name: 'OpenAI GPT', status: 'Creative and analytical AI', icon: 'bulb-outline', color: '#10b981' },
            { name: 'Grok AI', status: 'Real-time AI insights', icon: 'flash-outline', color: '#8b5cf6' },
            { name: 'Voice Assistant', status: 'Speech recognition available', icon: 'mic-outline', color: '#3b82f6' }
          ].map((service, index) => (
            <View key={index} style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 40,
                  height: 40,
                  backgroundColor: service.color,
                  borderRadius: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12
                }}>
                  <Ionicons name={service.icon as any} size={20} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>
                    {service.name}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#666' }}>
                    {service.status}
                  </Text>
                </View>
                <View style={{
                  width: 12,
                  height: 12,
                  backgroundColor: '#22c55e',
                  borderRadius: 6
                }} />
              </View>
            </View>
          ))}
        </View>

        {/* Privacy Notice */}
        <View style={{
          backgroundColor: '#f0fdf4',
          borderRadius: 12,
          padding: 16,
          borderWidth: 1,
          borderColor: '#10b981'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="shield-checkmark" size={20} color="#10b981" />
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#065f46',
              marginLeft: 8
            }}>
              Privacy Protected
            </Text>
          </View>
          <Text style={{
            fontSize: 14,
            color: '#047857',
            lineHeight: 20
          }}>
            Your conversations and data never leave your device. All AI processing 
            happens locally using Apple's Core ML framework.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Chat Screen Component
function ChatScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <View style={{
          width: 80,
          height: 80,
          backgroundColor: '#007AFF',
          borderRadius: 40,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 24
        }}>
          <Ionicons name="chatbubbles-outline" size={40} color="white" />
        </View>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 16 }}>
          AI Chat
        </Text>
        <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 32 }}>
          Start a conversation with your AI assistant{'\n'}Choose from Anthropic Claude, OpenAI GPT, or Grok AI
        </Text>
        <View style={{
          backgroundColor: '#007AFF',
          borderRadius: 12,
          padding: 16,
          minWidth: 200,
          alignItems: 'center'
        }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>
            Start Chatting
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Voice Screen Component
function VoiceScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <View style={{
          width: 80,
          height: 80,
          backgroundColor: '#ef4444',
          borderRadius: 40,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 24
        }}>
          <Ionicons name="mic-outline" size={40} color="white" />
        </View>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 16 }}>
          Voice Assistant
        </Text>
        <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 32 }}>
          Use voice commands to interact with your AI{'\n'}Speech-to-text and wake word detection
        </Text>
        <View style={{
          backgroundColor: '#ef4444',
          borderRadius: 12,
          padding: 16,
          minWidth: 200,
          alignItems: 'center'
        }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>
            🎤 Start Recording
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Tools Screen Component
function ToolsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 24, textAlign: 'center' }}>
          Smart Tools
        </Text>
        
        {[
          { name: 'Core ML Models', desc: 'Download and manage AI models', icon: 'hardware-chip', color: '#10b981' },
          { name: 'Calendar Integration', desc: 'AI-powered calendar management', icon: 'calendar-outline', color: '#3b82f6' },
          { name: 'Contacts Assistant', desc: 'Smart contact organization', icon: 'people-outline', color: '#f97316' },
          { name: 'File Manager', desc: 'AI-assisted file operations', icon: 'folder-outline', color: '#8b5cf6' },
          { name: 'Camera Tools', desc: 'Image analysis and processing', icon: 'camera-outline', color: '#ef4444' }
        ].map((tool, index) => (
          <Pressable key={index} style={{
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}>
            <View style={{
              width: 50,
              height: 50,
              backgroundColor: tool.color,
              borderRadius: 25,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 16
            }}>
              <Ionicons name={tool.icon as any} size={24} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>
                {tool.name}
              </Text>
              <Text style={{ fontSize: 14, color: '#666' }}>
                {tool.desc}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// Settings Screen Component
function SettingsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 24, textAlign: 'center' }}>
          Settings
        </Text>
        
        {[
          { name: 'AI Preferences', desc: 'Configure AI providers and models', icon: 'settings-outline', color: '#007AFF' },
          { name: 'Privacy Controls', desc: 'Data and privacy settings', icon: 'shield-checkmark', color: '#10b981' },
          { name: 'Voice Settings', desc: 'Speech and language preferences', icon: 'mic-outline', color: '#ef4444' },
          { name: 'Performance', desc: 'Optimize app performance', icon: 'speedometer-outline', color: '#f97316' },
          { name: 'About', desc: 'App information and support', icon: 'information-circle-outline', color: '#6b7280' }
        ].map((setting, index) => (
          <Pressable key={index} style={{
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}>
            <View style={{
              width: 50,
              height: 50,
              backgroundColor: setting.color,
              borderRadius: 25,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 16
            }}>
              <Ionicons name={setting.icon as any} size={24} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>
                {setting.name}
              </Text>
              <Text style={{ fontSize: 14, color: '#666' }}>
                {setting.desc}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// Main App with Tab Navigation
export default function App() {
  console.log('🧠 monGARS app with tabs starting...');
  
  return (
    <SafeAreaProvider>
      <NavigationContainer>
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
            tabBarStyle: {
              backgroundColor: 'white',
              borderTopWidth: 1,
              borderTopColor: '#e5e7eb',
              paddingBottom: 5,
              height: 85
            }
          })}
        >
          <Tab.Screen 
            name="Home" 
            component={HomeScreen}
            options={{ title: 'Home' }}
          />
          <Tab.Screen 
            name="Chat" 
            component={ChatScreen}
            options={{ title: 'Chat' }}
          />
          <Tab.Screen 
            name="Voice" 
            component={VoiceScreen}
            options={{ title: 'Voice' }}
          />
          <Tab.Screen 
            name="Tools" 
            component={ToolsScreen}
            options={{ title: 'Tools' }}
          />
          <Tab.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{ title: 'Settings' }}
          />
        </Tab.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}