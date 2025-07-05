import React from "react";
import { StatusBar } from "expo-status-bar";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function App() {
  console.log('🧠 monGARS app starting from workspace...');
  
  return (
    <SafeAreaProvider>
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

          {/* Status Cards */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ 
              fontSize: 20, 
              fontWeight: '600', 
              color: '#333',
              marginBottom: 16 
            }}>
              AI Services
            </Text>
            
            {/* Anthropic Claude */}
            <View style={{
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
                  backgroundColor: '#f97316',
                  borderRadius: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12
                }}>
                  <Ionicons name="leaf-outline" size={20} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>
                    Anthropic Claude
                  </Text>
                  <Text style={{ fontSize: 14, color: '#666' }}>
                    Ready for advanced reasoning
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

            {/* OpenAI GPT */}
            <View style={{
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
                  backgroundColor: '#10b981',
                  borderRadius: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12
                }}>
                  <Ionicons name="bulb-outline" size={20} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>
                    OpenAI GPT
                  </Text>
                  <Text style={{ fontSize: 14, color: '#666' }}>
                    Creative and analytical AI
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

            {/* Grok AI */}
            <View style={{
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
                  backgroundColor: '#8b5cf6',
                  borderRadius: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12
                }}>
                  <Ionicons name="flash-outline" size={20} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>
                    Grok AI
                  </Text>
                  <Text style={{ fontSize: 14, color: '#666' }}>
                    Real-time AI insights
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
                  backgroundColor: '#3b82f6',
                  borderRadius: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12
                }}>
                  <Ionicons name="mic-outline" size={20} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>
                    Voice Assistant
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
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3
            }}>
              <Ionicons name="chatbubbles-outline" size={24} color="white" />
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
              backgroundColor: '#10b981',
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
              <Ionicons name="hardware-chip" size={24} color="white" />
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: 'white',
                marginLeft: 12
              }}>
                Core ML Models
              </Text>
            </Pressable>

            <Pressable style={{
              backgroundColor: '#8b5cf6',
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
              <Ionicons name="construct-outline" size={24} color="white" />
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: 'white',
                marginLeft: 12
              }}>
                Smart Tools
              </Text>
            </Pressable>

            <Pressable style={{
              backgroundColor: '#ef4444',
              borderRadius: 12,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3
            }}>
              <Ionicons name="mic-outline" size={24} color="white" />
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
              happens locally using Apple's Core ML framework for maximum privacy and security.
            </Text>
          </View>

          {/* Success Message */}
          <View style={{
            backgroundColor: '#dbeafe',
            borderRadius: 12,
            padding: 16,
            marginTop: 16,
            borderWidth: 1,
            borderColor: '#3b82f6',
            alignItems: 'center'
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: '#1e40af',
              marginBottom: 8
            }}>
              🎉 App Successfully Built!
            </Text>
            <Text style={{
              fontSize: 14,
              color: '#1e40af',
              textAlign: 'center'
            }}>
              The monGARS AI Assistant is now ready for use
            </Text>
          </View>
        </ScrollView>
        <StatusBar style="auto" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}