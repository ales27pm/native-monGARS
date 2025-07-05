import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function VoiceScreen() {
  console.log('VoiceScreen rendering...');
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <View style={{ 
          width: 80, 
          height: 80, 
          backgroundColor: '#EF4444', 
          borderRadius: 40, 
          justifyContent: 'center', 
          alignItems: 'center',
          marginBottom: 20
        }}>
          <Ionicons name="mic" size={40} color="white" />
        </View>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>
          Voice
        </Text>
        <Text style={{ fontSize: 16, color: '#6B7280', textAlign: 'center' }}>
          Voice functionality will be implemented here
        </Text>
      </View>
    </SafeAreaView>
  );
}