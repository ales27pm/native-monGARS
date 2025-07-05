import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ 
            fontSize: 32, 
            fontWeight: 'bold', 
            color: '#007AFF',
            marginBottom: 8 
          }}>
            🧠 monGARS
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: '#666',
            lineHeight: 22 
          }}>
            Privacy-First AI Assistant{'\n'}
            On-device processing with Core ML
          </Text>
        </View>

        {/* Status Cards */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ 
            fontSize: 20, 
            fontWeight: '600', 
            color: '#333',
            marginBottom: 16 
          }}>
            System Status
          </Text>
          
          {/* AI Services */}
          <View style={{ 
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: '#e5e7eb'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ 
                width: 40,
                height: 40,
                backgroundColor: '#34d399',
                borderRadius: 20,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12
              }}>
                <Ionicons name="hardware-chip" size={20} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>
                  AI Services
                </Text>
                <Text style={{ fontSize: 14, color: '#666' }}>
                  Ready for inference
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

          {/* Voice Processing */}
          <View style={{ 
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: '#e5e7eb'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ 
                width: 40,
                height: 40,
                backgroundColor: '#3b82f6',
                borderRadius: 20,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12
              }}>
                <Ionicons name="mic" size={20} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>
                  Voice Processing
                </Text>
                <Text style={{ fontSize: 14, color: '#666' }}>
                  Speech recognition available
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

          {/* Privacy Mode */}
          <View style={{ 
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: '#e5e7eb'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ 
                width: 40,
                height: 40,
                backgroundColor: '#10b981',
                borderRadius: 20,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12
              }}>
                <Ionicons name="shield-checkmark" size={20} color="white" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>
                  Privacy Mode
                </Text>
                <Text style={{ fontSize: 14, color: '#666' }}>
                  All processing on-device
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
        </View>

        {/* Quick Actions */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ 
            fontSize: 20, 
            fontWeight: '600', 
            color: '#333',
            marginBottom: 16 
          }}>
            Quick Actions
          </Text>
          
          <Pressable style={{ 
            backgroundColor: '#007AFF',
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            <Ionicons name="chatbubble" size={24} color="white" />
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              color: 'white',
              marginLeft: 12
            }}>
              Start AI Chat
            </Text>
          </Pressable>

          <Pressable style={{ 
            backgroundColor: '#34d399',
            borderRadius: 12,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            <Ionicons name="mic" size={24} color="white" />
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              color: 'white',
              marginLeft: 12
            }}>
              Voice Commands
            </Text>
          </Pressable>
        </View>

        {/* Info */}
        <View style={{
          backgroundColor: '#f0f9ff',
          borderRadius: 12,
          padding: 16,
          borderWidth: 1,
          borderColor: '#0284c7'
        }}>
          <Text style={{ 
            fontSize: 16, 
            fontWeight: '600', 
            color: '#0284c7',
            marginBottom: 8
          }}>
            🔒 Privacy First
          </Text>
          <Text style={{ 
            fontSize: 14, 
            color: '#0369a1',
            lineHeight: 20
          }}>
            Your conversations and data never leave your device. All AI processing happens locally using Apple's Core ML framework.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}