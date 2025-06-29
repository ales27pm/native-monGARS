import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const AppInfo: React.FC = () => {
  return (
    <View className="px-4 py-6 bg-gray-50 rounded-t-3xl">
      <Text className="text-lg font-bold text-gray-900 mb-4 text-center">
        À propos de monGARS
      </Text>
      
      <View className="space-y-3">
        <View className="flex-row items-center">
          <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center mr-3">
            <Ionicons name="shield-checkmark" size={16} color="#10B981" />
          </View>
          <View className="flex-1">
            <Text className="font-medium text-gray-900">100% Privé</Text>
            <Text className="text-sm text-gray-600">Toutes vos données restent sur votre appareil</Text>
          </View>
        </View>
        
        <View className="flex-row items-center">
          <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3">
            <Ionicons name="lock-closed" size={16} color="#3B82F6" />
          </View>
          <View className="flex-1">
            <Text className="font-medium text-gray-900">Sécurisé</Text>
            <Text className="text-sm text-gray-600">Authentification biométrique et chiffrement</Text>
          </View>
        </View>
        
        <View className="flex-row items-center">
          <View className="w-8 h-8 bg-purple-100 rounded-full items-center justify-center mr-3">
            <Ionicons name="cpu-chip" size={16} color="#8B5CF6" />
          </View>
          <View className="flex-1">
            <Text className="font-medium text-gray-900">IA Locale</Text>
            <Text className="text-sm text-gray-600">Intelligence artificielle sans compromis de confidentialité</Text>
          </View>
        </View>
        
        <View className="flex-row items-center">
          <View className="w-8 h-8 bg-orange-100 rounded-full items-center justify-center mr-3">
            <Ionicons name="library" size={16} color="#F97316" />
          </View>
          <View className="flex-1">
            <Text className="font-medium text-gray-900">Mémoire Persistante</Text>
            <Text className="text-sm text-gray-600">Se souvient du contexte important de vos conversations</Text>
          </View>
        </View>
      </View>
      
      <Text className="text-center text-xs text-gray-500 mt-6">
        monGARS - Assistant IA privé • Version React Native
      </Text>
    </View>
  );
};