import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const DemoNotice: React.FC = () => {
  return (
    <View className="bg-amber-50 border border-amber-200 rounded-lg p-3 mx-4 mb-4">
      <View className="flex-row items-center">
        <Ionicons name="information-circle" size={16} color="#F59E0B" />
        <Text className="text-amber-800 text-sm font-medium ml-2">
          Mode démo
        </Text>
      </View>
      <Text className="text-amber-700 text-xs mt-1">
        Cette version utilise une authentification simulée. En production, Face ID/Touch ID serait utilisé pour une sécurité maximale.
      </Text>
    </View>
  );
};