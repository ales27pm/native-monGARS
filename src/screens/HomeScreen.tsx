import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useAppStore from '../state/appStore';

export default function HomeScreen() {
  const { checkAllServices, serviceStatus, getServiceCount } = useAppStore();

  useEffect(() => {
    console.log('HomeScreen mounted');
    checkAllServices();
  }, [checkAllServices]);

  const activeServices = getServiceCount();
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <View style={{ 
          width: 80, 
          height: 80, 
          backgroundColor: '#3B82F6', 
          borderRadius: 40, 
          justifyContent: 'center', 
          alignItems: 'center',
          marginBottom: 20
        }}>
          <Ionicons name="bulb-outline" size={40} color="white" />
        </View>
        <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>
          monGARS
        </Text>
        <Text style={{ fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 40 }}>
          Privacy-First AI Assistant
        </Text>
        
        {/* Service Status */}
        <View style={{
          backgroundColor: '#DBEAFE',
          padding: 20,
          borderRadius: 16,
          alignItems: 'center',
          marginBottom: 20,
          width: '100%'
        }}>
          <Text style={{ fontSize: 16, color: '#1E40AF', textAlign: 'center', marginBottom: 10 }}>
            🎉 App is running successfully!
          </Text>
          <Text style={{ fontSize: 14, color: '#1E40AF', textAlign: 'center' }}>
            Services Available: {activeServices}/4
          </Text>
        </View>

        {/* Service Details */}
        <View style={{ width: '100%', gap: 12 }}>
          {[
            { name: 'Anthropic', key: 'anthropic' as const, icon: '🤖' },
            { name: 'OpenAI', key: 'openai' as const, icon: '🧠' },
            { name: 'Grok', key: 'grok' as const, icon: '⚡' },
            { name: 'Voice', key: 'voice' as const, icon: '🎤' },
          ].map((service) => (
            <View key={service.key} style={{
              backgroundColor: '#FFFFFF',
              padding: 16,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, marginRight: 12 }}>{service.icon}</Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
                  {service.name}
                </Text>
              </View>
              <View style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: serviceStatus[service.key].available ? '#10B981' : '#EF4444'
              }} />
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
