import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LoadingIndicatorProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  message = "Chargement...", 
  size = 'medium' 
}) => {
  const sizeMap = {
    small: { icon: 20, text: 'text-sm' },
    medium: { icon: 32, text: 'text-base' },
    large: { icon: 48, text: 'text-lg' }
  };

  const { icon, text } = sizeMap[size];

  return (
    <View className="flex-1 justify-center items-center p-8">
      <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-4">
        <Ionicons name="sync" size={icon} color="#3B82F6" className="animate-spin" />
      </View>
      <Text className={`${text} text-gray-600 text-center`}>
        {message}
      </Text>
    </View>
  );
};