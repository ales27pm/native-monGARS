import React from "react";
import { View, Text } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          padding: 20 
        }}>
          <Text style={{ 
            fontSize: 28, 
            fontWeight: 'bold', 
            color: '#007AFF',
            marginBottom: 16,
            textAlign: 'center'
          }}>
            🧠 monGARS
          </Text>
          <Text style={{ 
            fontSize: 18, 
            color: '#333',
            marginBottom: 12,
            textAlign: 'center'
          }}>
            Privacy-First AI Assistant
          </Text>
          <Text style={{ 
            fontSize: 14, 
            color: '#666',
            textAlign: 'center',
            lineHeight: 20
          }}>
            On-device AI processing with Core ML{'\n'}
            Your conversations stay private
          </Text>
          <View style={{
            marginTop: 40,
            padding: 16,
            backgroundColor: '#E8F5E8',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#4CAF50',
          }}>
            <Text style={{ 
              fontSize: 16, 
              color: '#2E7D32',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              ✅ App Loading Successfully
            </Text>
          </View>
        </View>
        <StatusBar style="auto" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}